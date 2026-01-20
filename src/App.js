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
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (!window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) return;

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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Control de Cambio de Aceite</h1>
        <p className="text-gray-600 mb-8">
          Autos de la Empresa {syncing && '(Sincronizando...)'}
        </p>

        {/* === DOS COLUMNAS === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* FORMULARIO */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">
              {editingId ? 'Editar Vehículo' : 'Agregar Vehículo'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="make" value={formData.make} onChange={handleInputChange} placeholder="Marca y modelo" className="input" />
                <input type="date" name="lastOilChange" value={formData.lastOilChange} onChange={handleInputChange} className="input" />
                <input type="number" name="mileage" value={formData.mileage} onChange={handleInputChange} placeholder="Kilometraje actual" className="input" />
                <input type="number" name="nextChangeAt" value={formData.nextChangeAt} onChange={handleInputChange} placeholder="Próximo cambio (km)" className="input" />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleAddVehicle} disabled={syncing} className="btn-primary">
                  <Plus size={20} /> {editingId ? 'Actualizar' : 'Agregar'}
                </button>

                {editingId && (
                  <button onClick={() => { setEditingId(null); setFormData({ make:'', lastOilChange:'', mileage:'', nextChangeAt:'' }); }} className="btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* VEHÍCULOS */}
          <div className="space-y-4">
            {vehicles.map(vehicle => {
              const mileage = parseInt(vehicle.mileage) || 0;
              const nextChangeAt = parseInt(vehicle.nextChangeAt) || 0;
              const statusColor = getStatusColor(mileage, nextChangeAt);
              const statusText = getStatusText(mileage, nextChangeAt);

              return (
                <div key={vehicle.id} className={`rounded-lg shadow-lg p-6 border-2 ${statusColor}`}>
                  <h3 className="text-xl font-bold">{vehicle.make}</h3>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(vehicle)} className="btn-primary">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(vehicle.id)} className="btn-danger">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
