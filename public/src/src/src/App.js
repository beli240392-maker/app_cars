import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Loader } from 'lucide-react';
import './App.css';

const FIREBASE_PROJECT = "mantenimiento-autos-b2624";
const FIREBASE_API_KEY = "AIzaSyDFNIMEcyk-r1vbbQz5CmpTpVmFtLxWEC0";

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    lastOilChange: '',
    mileage: '',
    nextDueKm: '5000'
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
              name: fields.name?.stringValue || '',
              make: fields.make?.stringValue || '',
              lastOilChange: fields.lastOilChange?.stringValue || '',
              mileage: fields.mileage?.stringValue || '',
              nextDueKm: fields.nextDueKm?.stringValue || '5000'
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
    if (!formData.name || !formData.make || !formData.lastOilChange) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSyncing(true);

    try {
      const vehicleData = {
        fields: {
          name: { stringValue: formData.name },
          make: { stringValue: formData.make },
          lastOilChange: { stringValue: formData.lastOilChange },
          mileage: { stringValue: formData.mileage },
          nextDueKm: { stringValue: formData.nextDueKm }
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
        name: '',
        make: '',
        lastOilChange: '',
        mileage: '',
        nextDueKm: '5000'
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

  const calculateDaysSince = (date) => {
    const lastChange = new Date(date);
    const today = new Date();
    const days = Math.floor((today - lastChange) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusColor = (days) => {
    if (days > 180) return 'bg-red-100 border-red-300';
    if (days > 90) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getStatusText = (days) => {
    if (days > 180) return 'Cambio urgente';
    if (days > 90) return 'Próximamente';
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
        <p className="text-gray-600 mb-8">🌐 Datos compartidos en tiempo real con tu equipo {syncing && '(Sincronizando...)'}</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            {editingId ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del vehículo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Auto principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  Próximo cambio cada (km)
                </label>
                <select
                  name="nextDueKm"
                  value={formData.nextDueKm}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5000">5000 km</option>
                  <option value="10000">10000 km</option>
                  <option value="15000">15000 km</option>
                </select>
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
                  o
