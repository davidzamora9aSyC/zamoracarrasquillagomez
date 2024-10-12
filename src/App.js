// src/App.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Importamos la librería xlsx

function App() {
    const [selectedOption, setSelectedOption] = useState(null);
    const [classificationType, setClassificationType] = useState('single');
    const [opinions, setOpinions] = useState(['']);
    const [fileData, setFileData] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null); // Nuevo estado para el archivo original
    const [result, setResult] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [encoding, setEncoding] = useState('UTF-8');

    const handleOptionChange = (option) => {
        setSelectedOption(option);
        setResult(null);
        setMetrics(null);
    };

    const handleOpinionChange = (index, value) => {
        const newOpinions = [...opinions];
        newOpinions[index] = value;
        setOpinions(newOpinions);
    };

    const addOpinionField = () => {
        setOpinions([...opinions, '']);
    };

    const removeOpinionField = (index) => {
        const newOpinions = opinions.filter((_, i) => i !== index);
        setOpinions(newOpinions);
    };

    const handleCSVToJson = (csv) => {
        const lines = csv.split("\n");
        const textos = lines.map(line => line.trim()).filter(line => line !== "");
        return { textos };
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        setUploadedFile(file); // Almacenamos el archivo original
        const fileName = file.name;
        const fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();

        if (fileExtension === 'csv') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const csvContent = e.target.result;
                const jsonContent = handleCSVToJson(csvContent);
                setFileData(jsonContent);
            };
            reader.readAsText(file, encoding);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const textos = jsonData.flat().filter(cell => typeof cell === 'string' && cell.trim() !== '');

                setFileData({ textos });
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Por favor, sube un archivo CSV o XLSX válido.');
        }
    };

    const handleClassify = async () => {
        let requestBody;

        if (classificationType === 'single' && opinions.length > 0) {
            requestBody = { textos: opinions };
        } else if (classificationType === 'multiple' && fileData) {
            requestBody = fileData;
        }

        if (requestBody) {
            const response = await fetch('http://127.0.0.1:8000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const data = await response.json();
            setResult(data);
        }
    };

    const handleRetrain = async () => {
        if (uploadedFile) {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const response = await fetch('http://127.0.0.1:8000/retrain', {
                method: 'POST',
                body: formData
            });
            const metricsData = await response.json();
            setMetrics(metricsData);
        } else {
            alert('Por favor, sube un archivo para reentrenar.');
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-6">Clasificación y Reentrenamiento del Modelo</h1>
                <div className="flex justify-center gap-4 mb-8">
                    <button 
                        onClick={() => handleOptionChange('classify')} 
                        className="btn btn-primary"
                    >
                        Clasificar Opinión
                    </button>
                    <button 
                        onClick={() => handleOptionChange('retrain')} 
                        className="btn btn-secondary"
                    >
                        Reentrenar Modelo
                    </button>
                </div>

                {selectedOption === 'classify' && (
                    <div className="classify-section mb-6">
                        <h2 className="text-2xl font-semibold mb-4">Clasificar Opinión</h2>
                        <h2 className="text-2xl font-semibold mb-4">Asegúrate de poner textos con buena ortografía</h2>
                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text">Tipo de clasificación:</span>
                            </label>
                            <select 
                                className="select select-bordered w-full"
                                value={classificationType}
                                onChange={(e) => setClassificationType(e.target.value)}
                            >
                                <option value="single">Clasificar varias opiniones manualmente</option>
                                <option value="multiple">Clasificar varias opiniones (CSV o XLSX)</option>
                            </select>
                        </div>

                        {classificationType === 'multiple' && (
                            <div className="mb-4">
                                <label className="label">
                                    <span className="label-text">Selecciona la codificación del archivo (solo para CSV):</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full"
                                    value={encoding}
                                    onChange={(e) => setEncoding(e.target.value)}
                                >
                                    <option value="UTF-8">UTF-8</option>
                                    <option value="ISO-8859-1">Latin-1 (ISO-8859-1)</option>
                                </select>
                            </div>
                        )}

                        {classificationType === 'single' ? (
                            <div>
                                {opinions.map((opinion, index) => (
                                    <div key={index} className="mb-4 flex items-center">
                                        <textarea
                                            value={opinion}
                                            onChange={(e) => handleOpinionChange(index, e.target.value)}
                                            placeholder={`Opinión ${index + 1}`}
                                            className="textarea textarea-bordered w-full"
                                        />
                                        <button 
                                            onClick={() => removeOpinionField(index)} 
                                            className="btn btn-danger ml-2"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={addOpinionField} 
                                    className="btn btn-secondary mb-4 w-full"
                                >
                                    Agregar más opiniones
                                </button>
                                <button 
                                    onClick={handleClassify} 
                                    className="btn btn-primary w-full"
                                >
                                    Clasificar
                                </button>
                            </div>
                        ) : (
                            <div>
                                <input 
                                    type="file" 
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileUpload} 
                                    className="file-input file-input-bordered w-full mb-4"
                                />
                                <button 
                                    onClick={handleClassify} 
                                    className="btn btn-primary w-full"
                                >
                                    Clasificar
                                </button>
                            </div>
                        )}

                        {result && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg">Resultado:</h3>
                                <ul className="list-disc list-inside">
                                    {Array.isArray(result) ? result.map((r, index) => (
                                        <li key={index}>
                                            {`Clasificación: ${r.clase_predicha}, Probabilidad: ${(r.probabilidad * 100).toFixed(2)}%`}
                                        </li>
                                    )) : (
                                        <li>
                                            {`Clasificación: ${result.clase_predicha}, Probabilidad: ${(result.probabilidad * 100).toFixed(2)}%`}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {selectedOption === 'retrain' && (
                    <div className="retrain-section mb-6">
                        <h2 className="text-2xl font-semibold mb-4">Reentrenar Modelo</h2>
                        <input 
                            type="file" 
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileUpload} 
                            className="file-input file-input-bordered w-full mb-4"
                        />
                        <button 
                            onClick={handleRetrain} 
                            className="btn btn-secondary w-full"
                        >
                            Reentrenar
                        </button>
                        {metrics && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg">Métricas de Desempeño:</h3>
                                <p>{JSON.stringify(metrics)}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
