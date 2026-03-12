import 'server-only';

export type Camera = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  lastActivity?: string;
  issues?: string[];
  imageId: string;
};

export type School = {
  id: string;
  name: string;
  cameras: Camera[];
};

const cameraImageIds = [
  "cam_entrance", "cam_hallway", "cam_cafeteria", "cam_playground", 
  "cam_library", "cam_gym", "cam_parking", "cam_office"
];

const cameraNames = [
  "Entrada Principal", "Pasillo Este", "Cafetería", "Área de Juegos",
  "Biblioteca", "Gimnasio", "Estacionamiento de Personal", "Oficina Administrativa", "Pasillo Oeste",
  "Laboratorio de Ciencias", "Sala de Arte", "Zona de Carga de Autobuses"
];

const cameraStatuses: Camera['status'][] = ['online', 'online', 'online', 'online', 'online', 'offline', 'error', 'online'];

function createCameras(count: number): Camera[] {
  const cameras: Camera[] = [];
  for (let i = 0; i < count; i++) {
    const name = cameraNames[i % cameraNames.length];
    const status = cameraStatuses[Math.floor(Math.random() * cameraStatuses.length)];
    cameras.push({
      id: `cam-${i + 1}`,
      name: `${name} #${Math.floor(i / cameraNames.length) + 1}`,
      status,
      imageId: cameraImageIds[i % cameraImageIds.length],
      lastActivity: status !== 'offline' ? new Date(Date.now() - Math.random() * 1000 * 3600).toISOString() : undefined,
      issues: status === 'error' ? ['Baja tasa de bits', 'Conexión intermitente'] : [],
    });
  }
  return cameras;
}

const schools: School[] = [
  { id: 'northwood', name: 'Northwood High', cameras: createCameras(8) },
  { id: 'oakdale', name: 'Oakdale Elementary', cameras: createCameras(6) },
  { id: 'riverbend', name: 'Riverbend Middle', cameras: createCameras(10) },
  { id: 'summit', name: 'Summit Academy', cameras: createCameras(5) },
  { id: 'creekside', name: 'Creekside Junior High', cameras: createCameras(12) },
  { id: 'maple-grove', name: 'Maple Grove Institute', cameras: createCameras(7) },
  { id: 'pine-ridge', name: 'Pine Ridge School', cameras: createCameras(9) },
];

// Simulate async API calls
export const getSchools = async (): Promise<School[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return schools;
};

export const getSchoolById = async (id: string): Promise<School | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return schools.find(school => school.id === id);
};
