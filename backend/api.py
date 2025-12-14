"""
Flask API wrapper for KenKen puzzle generator and solver
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Get the project root directory (kenken/)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Get the src directory
src_dir = os.path.join(project_root, 'src')

# Add both project root and src directory to path
sys.path.insert(0, project_root)
sys.path.insert(0, src_dir)

from src.kenken import generate, benchmark, Kenken
import src.csp as csp

app = Flask(__name__)

# Configure CORS once, at the top, right after creating the app
# Flask-CORS will automatically handle OPTIONS preflight requests
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Algorithm mapping
ALGORITHMS = {
    'BT': lambda ken: csp.backtracking_search(ken),
    'BT+MRV': lambda ken: csp.backtracking_search(ken, select_unassigned_variable=csp.mrv),
    'FC': lambda ken: csp.backtracking_search(ken, inference=csp.forward_checking),
    'FC+MRV': lambda ken: csp.backtracking_search(ken, inference=csp.forward_checking, select_unassigned_variable=csp.mrv),
    'MAC': lambda ken: csp.backtracking_search(ken, inference=csp.mac),
    'MIN_CONFLICTS': lambda ken: csp.min_conflicts(ken),
}

def assignment_to_board(assignment, size, cliques):
    """Convert CSP assignment to 2D board"""
    if not assignment:
        return [[0] * size for _ in range(size)]
    
    # Create mapping from cell to value
    cell_to_value = {}
    for members, operator, target in cliques:
        values = assignment.get(members)
        if values:
            for i, cell in enumerate(members):
                # Convert from 1-indexed to 0-indexed
                row = cell[0] - 1
                col = cell[1] - 1
                cell_to_value[(row, col)] = values[i]
    
    # Build board
    board = [[0] * size for _ in range(size)]
    for (row, col), value in cell_to_value.items():
        board[row][col] = value
    
    return board

def cliques_to_cages(cliques):
    """Convert backend cliques format to frontend cages format"""
    cages = []
    for members, operator, target in cliques:
        # Convert operator '.' to '=' for single-cell cages
        op = '=' if operator == '.' else operator
        # Convert from 1-indexed to 0-indexed coordinates
        cells = [[cell[0] - 1, cell[1] - 1] for cell in members]
        cages.append({
            'cells': cells,
            'operator': op,
            'target': target
        })
    return cages

@app.route('/api/generate', methods=['POST'])
def generate_puzzle():
    """Generate a new KenKen puzzle"""
    try:
        data = request.json
        size = data.get('size', 4)
        algorithm_name = data.get('algorithm', 'FC+MRV')
        
        # Generate puzzle
        size, cliques = generate(size)
        
        # Create Kenken CSP
        kenken = Kenken(size, cliques)
        
        # Solve to get solution and benchmark
        algorithm = ALGORITHMS.get(algorithm_name)
        if not algorithm:
            return jsonify({'error': f'Unknown algorithm: {algorithm_name}'}), 400
        
        assignment, (checks, assigns, dt) = benchmark(kenken, algorithm)
        
        # Convert assignment to board
        solution = assignment_to_board(assignment, size, cliques)
        
        # Format response
        response = {
            'puzzle': {
                'size': size,
                'cages': cliques_to_cages(cliques),
                'solution': solution
            },
            'stats': {
                'algorithm': algorithm_name,
                'constraint_checks': checks,
                'assignments': assigns,
                'completion_time': dt
            }
        }
        
        return jsonify(response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/solve', methods=['POST'])
def solve_puzzle():
    """Solve a KenKen puzzle"""
    try:
        data = request.json
        puzzle_data = data.get('puzzle')
        algorithm_name = data.get('algorithm', 'FC+MRV')
        
        # Convert frontend format to backend format
        size = puzzle_data['size']
        cliques = []
        for cage in puzzle_data['cages']:
            # Convert from 0-indexed to 1-indexed coordinates
            cells = [(cell[0] + 1, cell[1] + 1) for cell in cage['cells']]
            operator = '.' if cage['operator'] == '=' else cage['operator']
            cliques.append((tuple(cells), operator, cage['target']))
        
        # Create Kenken CSP
        kenken = Kenken(size, cliques)
        
        # Solve puzzle
        algorithm = ALGORITHMS.get(algorithm_name)
        if not algorithm:
            return jsonify({'error': f'Unknown algorithm: {algorithm_name}'}), 400
        
        assignment, (checks, assigns, dt) = benchmark(kenken, algorithm)
        
        # Convert assignment to board
        solution = assignment_to_board(assignment, size, cliques)
        
        return jsonify({
            'solution': solution,
            'stats': {
                'algorithm': algorithm_name,
                'constraint_checks': checks,
                'assignments': assigns,
                'completion_time': dt
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate', methods=['POST'])
def validate():
    """Validate the current board state"""
    try:
        data = request.json
        puzzle_data = data.get('puzzle')
        board = data.get('board')
        
        errors = []
        
        # Validate rows (no duplicates)
        for row in range(puzzle_data['size']):
            values = [board[row][col] for col in range(puzzle_data['size']) if board[row][col] > 0]
            seen = set()
            for col in range(puzzle_data['size']):
                val = board[row][col]
                if val > 0:
                    if val in seen:
                        errors.append({
                            'row': row,
                            'col': col,
                            'message': f'Duplicate {val} in row'
                        })
                    seen.add(val)
        
        # Validate columns (no duplicates)
        for col in range(puzzle_data['size']):
            values = [board[row][col] for row in range(puzzle_data['size']) if board[row][col] > 0]
            seen = set()
            for row in range(puzzle_data['size']):
                val = board[row][col]
                if val > 0:
                    if val in seen:
                        errors.append({
                            'row': row,
                            'col': col,
                            'message': f'Duplicate {val} in column'
                        })
                    seen.add(val)
        
        # Validate cages
        for cage in puzzle_data['cages']:
            cage_values = [
                board[cell[0]][cell[1]]
                for cell in cage['cells']
                if board[cell[0]][cell[1]] > 0
            ]
            
            if len(cage_values) == len(cage['cells']):
                # All cells filled, check constraint
                if not _evaluate_cage(cage, cage_values):
                    for cell in cage['cells']:
                        errors.append({
                            'row': cell[0],
                            'col': cell[1],
                            'message': 'Cage constraint not satisfied'
                        })
        
        return jsonify({
            'valid': len(errors) == 0,
            'errors': errors
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _evaluate_cage(cage, values):
    """Evaluate if cage values satisfy the constraint"""
    if cage['operator'] == '=':
        return len(values) == 1 and values[0] == cage['target']
    
    sorted_values = sorted(values)
    
    if cage['operator'] == '+':
        return sum(sorted_values) == cage['target']
    elif cage['operator'] == '-':
        if len(sorted_values) != 2:
            return False
        return abs(sorted_values[0] - sorted_values[1]) == cage['target']
    elif cage['operator'] == '*':
        product = 1
        for v in sorted_values:
            product *= v
        return product == cage['target']
    elif cage['operator'] == '/':
        if len(sorted_values) != 2:
            return False
        a, b = sorted_values
        return (a / b == cage['target']) or (b / a == cage['target'])
    
    return False

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Backend is running'})

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({'message': 'KenKen API is running', 'endpoints': ['/api/generate', '/api/solve', '/api/validate', '/api/health']})

if __name__ == '__main__':
    import sys
    # Allow port to be specified as command line argument, default to 5001 to avoid AirPlay conflict
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    print(f"Starting KenKen API server on http://localhost:{port}")
    print("CORS enabled for http://localhost:3000")
    print(f"Note: If you want to use port 5000, disable AirPlay Receiver in System Preferences")
    app.run(debug=True, port=port, host='0.0.0.0')
