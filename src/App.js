import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Loader } from 'lucide-react';
import './App.css';

const FIREBASE_PROJECT = "mantenimiento-autos-b2624";
const FIREBASE_API_KEY = "AIzaSyDFNIMEcyk-r1vbbQz5CmpTpVmFtLxWEC0";

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    make: '',
    lastOilChange: '',
    mileage: '',
    nextChangeAt: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadVehicles();
    const interval = setInterval(loadVehicles, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/vehicles?key=${FIREBASE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const vehiclesData = [];
        
        if (data.documents) {
          data.documents.forEach(doc => {
            const fields = doc.fields;
            vehiclesData.push({
              id: doc.name.split('/').pop(),
              make: fields.make?.stringValue || '',
              lastOilChange: fields.lastOilChange?.stringValue || '',
              mileage: fields.mileage?.stringValue || '',
              nextChangeAt: fields.nextChangeAt?.stringValue || ''
            });
          });
        }
        
        setVehicles(vehiclesData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddVehicle = async () => {
    if (!formData.make || !formData.lastOilChange || !formData.mileage || !formData.nextChangeAt) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSyncing(true);

    try {
      const vehicleData = {
        fields: {
          make: { stringValue: formData.make },
          lastOilChange: { stringValue: formData.lastOilChange },
          mileage: { stringValue: formData.mileage },
          nextChangeAt: { stringValue: formData.nextChangeAt }
        }
      };

      if (editingId) {
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/vehicles/${editingId}?key=${FIREBASE_API_KEY}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
          }
        );

        if (response.ok) {
          setEditingId(null);
          await loadVehicles();
        } else {
          alert('Error al actualizar el vehículo');
        }
      } else {
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/vehicles?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
          }
        );

        if (response.ok) {
          await loadVehicles();
        } else {
          alert('Error al guardar el vehículo');
        }
      }

      setFormData({
        make: '',
        lastOilChange: '',
        mileage: '',
        nextChangeAt: ''
      });
    } catch (error) {
      console.error("Error guardando vehículo:", error);
      alert('Error al guardar el vehículo');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      setSyncing(true);
      try {
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/vehicles/${id}?key=${FIREBASE_API_KEY}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          await loadVehicles();
        } else {
          alert('Error al eliminar el vehículo');
        }
      } catch (error) {
        console.error("Error eliminando vehículo:", error);
        alert('Error al eliminar el vehículo');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleEdit = (vehicle) => {
    setFormData(vehicle);
    setEditingId(vehicle.id);
  };

  const getStatusColor = (mileage, nextChangeAt) => {
    const remaining = nextChangeAt - mileage;
    if (remaining <= 0) return 'bg-red-100 border-red-300';
    if (remaining <= 1000) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getStatusText = (mileage, nextChangeAt) => {
    const remaining = nextChangeAt - mileage;
    if (remaining <= 0) return 'Cambio urgente';
    if (remaining <= 1000) return 'Próximamente';
    return 'Al día';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Control de Cambio de Aceite</h1>
       

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            {editingId ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca y modelo
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="Ej: Toyota Corolla"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Último cambio de aceite
                </label>
                <input
                  type="date"
                  name="lastOilChange"
                  value={formData.lastOilChange}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilometraje actual
                </label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  placeholder="Ej: 50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próximo cambio en (km)
                </label>
                <input
                  type="number"
                  name="nextChangeAt"
                  value={formData.nextChangeAt}
                  onChange={handleInputChange}
                  placeholder="Ej: 55000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddVehicle}
                disabled={syncing}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
              >
                <Plus size={20} />
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      make: '',
                      lastOilChange: '',
                      mileage: '',
                      nextChangeAt: ''
                    });
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  Cancelar
                    
                <div>
                  <span>Cancelar</span>
                  <button onClick={() => handleEdit(vehicle)}>
                    Editar
                  </button>
                </div>

               
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p className="text-lg">No hay vehículos registrados. ¡Agrega uno para comenzar!</p>
            </div>
          ) : (
            vehicles.map(vehicle => {
              const mileage = parseInt(vehicle.mileage) || 0;
              const nextChangeAt = parseInt(vehicle.nextChangeAt) || 0;
              const statusColor = getStatusColor(mileage, nextChangeAt);
              const statusText = getStatusText(mileage, nextChangeAt);
              const remaining = nextChangeAt - mileage;

              return (
                <div key={vehicle.id} className={`rounded-lg shadow-lg p-6 border-2 ${statusColor}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{vehicle.make}</h3>
                    </div>
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                      {statusText}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Último cambio</p>
                      <p className="font-semibold text-gray-800">{vehicle.lastOilChange}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kilometraje actual</p>
                      <p className="font-semibold text-gray-800">{vehicle.mileage} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Próximo cambio</p>
                      <p className="font-semibold text-gray-800">{vehicle.nextChangeAt} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Falta</p>
                      <p className="font-semibold text-gray-800">{remaining} km</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={syncing}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition disabled:bg-gray-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
