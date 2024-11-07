import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend
from flask import Flask, jsonify, render_template, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the Excel file
def load_excel_data():
    data = {}
    workbook = pd.ExcelFile('data.xlsx')  # Ensure your Excel file is named data.xlsx
    for sheet in workbook.sheet_names:
        df = workbook.parse(sheet)
        data[sheet] = df.to_dict(orient='records')
    return data

data = load_excel_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compounds', methods=['GET'])
def get_compounds():
    compounds = {}
    total_compounds = 0

    for sheet_name, records in data.items():
        compounds[sheet_name] = []
        for record in records:
            compound_types = ['Preservative', 'Nematicide', 'Herbicide', 'Insecticide', 
                              'Bactericide', 'Molluscicide', 'Acaricide', 'Fungicide', 'Rodenticide']
            for compound_type in compound_types:
                if compound_type in record and pd.notna(record[compound_type]):
                    sanitized_record = {k: (v if pd.notna(v) else None) for k, v in record.items()}
                    compounds[sheet_name].append({
                        'name': sanitized_record[compound_type],
                        'type': compound_type,
                        'sheet': sheet_name,
                        **sanitized_record
                    })
                    total_compounds += 1

    return jsonify({'compounds': compounds, 'total_compounds': total_compounds})

@app.route('/compound-details/<sheet>/<compound>/<type>', methods=['GET'])
def get_compound_details(sheet, compound, type):
    if sheet not in data:
        return jsonify({"error": "Sheet not found"}), 404
    compound_data = next((item for item in data[sheet] if item[type].lower() == compound.lower()), None)
    if compound_data is None:
        return jsonify({"error": "Compound not found"}), 404
    return jsonify(compound_data)

@app.route('/plot/<sheet>/<compound>/<type>', methods=['GET'])
def plot_comparative_graph(sheet, compound, type):
    if sheet not in data:
        return jsonify({"error": "Sheet not found"}), 404

    selected_compound_data = next((item for item in data[sheet] if item[type].lower() == compound.lower()), None)
    if not selected_compound_data:
        return jsonify({"error": "No data available for this compound"}), 404

    selected_consumption_level = float(selected_compound_data.get("Level of Consumption(in ppm)", 0))
    selected_risk_level = selected_compound_data.get("Risk", "safe").strip().lower()

    labels = []
    consumption_levels = []
    risk_levels = []

    for record in data[sheet]:
        if record[type]:
            labels.append(record[type])
            consumption_levels.append(float(record.get("Level of Consumption(in ppm)", 0)))
            risk_level = record.get("Risk", "safe").strip().lower()
            risk_levels.append(risk_level)

    selected_index = labels.index(compound) if compound in labels else -1

    bar_width = 0.25
    x = np.arange(len(labels))

    plt.figure(figsize=(12, 6))

    # Set colors based on risk level
    colors = []
    for risk in risk_levels:
        if risk == 'banned':
            colors.append('black')
        elif risk == 'moderate risk':
            colors.append('orange')
        elif risk == 'high risk':
            colors.append('red')
        elif risk == 'low risk' or risk == 'considered safe' or risk=='consider safe':
            colors.append('green')
        else:
            colors.append('lightgray')

    if selected_index != -1:
        colors[selected_index] = 'blue'  # Highlight the selected compound in blue

    plt.bar(x + bar_width, consumption_levels, width=bar_width, color=colors)

    # Option 1: Using logarithmic scale
    plt.yscale('log')

    # Add a label for the selected compound
    if selected_index != -1:
        plt.text(selected_index + bar_width, consumption_levels[selected_index], selected_risk_level.capitalize(),
                 ha='center', va='bottom', fontsize=10, color='black', fontweight='bold')

    plt.xlabel('Compounds')
    plt.ylabel('log(Values (ppm))')
    plt.title('Comparative Analysis of Compounds')
    plt.xticks(x + bar_width, labels, rotation=45, ha='right')
    plt.legend()
    plt.subplots_adjust(bottom=0.4)  # Adjust bottom margin

    os.makedirs('temp', exist_ok=True)
    plot_path = f'temp/{compound}_comparative_plot.png'
    plt.savefig(plot_path)
    plt.close()
    return send_file(plot_path, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)
