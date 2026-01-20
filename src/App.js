import { useState } from "react";

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    lastChange: "",
    currentKm: "",
    nextKm: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setVehicles(
        vehicles.map((v) =>
          v.id === editingId ? { ...v, ...form } : v
        )
      );
      setEditingId(null);
    } else {
      setVehicles([
        ...vehicles,
        {
          id: Date.now(),
          ...form
        }
      ]);
    }

    setForm({
      name: "",
      lastChange: "",
      currentKm: "",
      nextKm: ""
    });
  };

  const handleEdit = (vehicle) => {
    setForm(vehicle);
    setEditingId(vehicle.id);
  };

  const handleDelete = (id) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
  };

  const kmLeft = (v) => v.nextKm - v.currentKm;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ================= FORMULARIO ================= */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-700">
              {editingId ? "Editar Vehículo" : "Agregar Vehículo"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Marca y modelo
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Toyota Corolla"
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Último cambio de aceite
                </label>
                <input
                  type="date"
                  name="lastChange"
                  value={form.lastChange}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Kilometraje actual
                </label>
                <input
                  type="number"
                  name="currentKm"
                  value={form.currentKm}
                  onChange={handleChange}
                  placeholder="Ej: 50000"
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Próximo cambio (km)
                </label>
                <input
                  type="number"
                  name="nextKm"
                  value={form.nextKm}
                  onChange={handleChange}
                  placeholder="Ej: 55000"
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                {editingId ? "Guardar cambios" : "Agregar"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      name: "",
                      lastChange: "",
                      currentKm: "",
                      nextKm: ""
                    });
                  }}
                  className="w-full border py-2 rounded-md"
                >
                  Cancelar
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ================= LISTA DE VEHÍCULOS ================= */}
        <div className="lg:col-span-2 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {vehicles.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No hay vehículos registrados
            </div>
          ) : (
            vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-green-100 border border-green-300 rounded-lg p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{v.name}</h3>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    Al día
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Último cambio</p>
                    <p className="font-semibold">{v.lastChange}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Kilometraje actual</p>
                    <p className="font-semibold">{v.currentKm} km</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Próximo cambio</p>
                    <p className="font-semibold">{v.nextKm} km</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Falta</p>
                    <p className="font-semibold">{kmLeft(v)} km</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleEdit(v)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-md"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="bg-red-500 text-white px-4 rounded-md"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
