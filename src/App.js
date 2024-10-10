// src/App.js
import React, { useState } from 'react';

function App() {
    const [selectedOption, setSelectedOption] = useState(null);
    const [classificationType, setClassificationType] = useState('single');
    const [opinion, setOpinion] = useState('');
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [metrics, setMetrics] = useState(null);

    const handleOptionChange = (option) => {
        setSelectedOption(option);
        setResult(null);
        setMetrics(null);
    };

    const handleClassify = async () => {
        if (classificationType === 'single') {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opinion })
            });
            const data = await response.json();
            setResult(data);
        } else if (classificationType === 'multiple' && file) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/predict', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            setResult(data);
        }
    };

    const handleRetrain = async () => {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/retrain', {
                method: 'POST',
                body: formData
            });
            const metricsData = await response.json();
            setMetrics(metricsData);
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
                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text">Tipo de clasificación:</span>
                            </label>
                            <select 
                                className="select select-bordered w-full"
                                value={classificationType}
                                onChange={(e) => setClassificationType(e.target.value)}
                            >
                                <option value="single">Clasificar una opinión</option>
                                <option value="multiple">Clasificar varias opiniones (CSV)</option>
                            </select>
                        </div>

                        {classificationType === 'single' ? (
                            <div>
                                <textarea
                                    value={opinion}
                                    onChange={(e) => setOpinion(e.target.value)}
                                    placeholder="Escribe la opinión aquí..."
                                    className="textarea textarea-bordered w-full mb-4"
                                />
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
                                    onChange={(e) => setFile(e.target.files[0])} 
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
                                            {`Clasificación: ${r.label}, Probabilidad: ${(r.probability * 100).toFixed(2)}%`}
                                        </li>
                                    )) : (
                                        <li>
                                            {`Clasificación: ${result.label}, Probabilidad: ${(result.probability * 100).toFixed(2)}%`}
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
                            onChange={(e) => setFile(e.target.files[0])} 
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
