/**
 * Test file demonstrating PresetManager component usage
 * This shows how to integrate PresetManager into ProjectManagement
 */

import PresetManager from "@/components/projects/PresetManager";
import { Project } from "@/lib/db";

// Example usage in ProjectManagement component
function ProjectManagementExample() {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    // Fetch projects logic
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data.projects);
  };

  return (
    <div className="space-y-6">
      {/* Other components... */}
      
      {/* Preset Manager Section */}
      <ComponentCard title="Film Arrangement Presets">
        <PresetManager
          currentProjects={projects}
          onPresetApplied={fetchProjects}
        />
      </ComponentCard>
    </div>
  );
}

// Example: Testing preset save functionality
async function testSavePreset() {
  const mockProjects: Project[] = [
    { id: "1", title: "Film A", order_index: 1, /* ... */ },
    { id: "2", title: "Film B", order_index: 2, /* ... */ },
    { id: "3", title: "Film C", order_index: 3, /* ... */ },
  ];

  const orderConfig = mockProjects.map((project, index) => ({
    projectId: project.id,
    orderIndex: project.order_index || index + 1,
  }));

  const response = await fetch("/api/projects/presets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Featured Films First",
      description: "Arrangement with featured films at the top",
      orderConfig,
    }),
  });

  const result = await response.json();
  console.log("Preset saved:", result.preset);
}

// Example: Testing preset apply functionality
async function testApplyPreset(presetId: string) {
  const response = await fetch(`/api/projects/presets/${presetId}/apply`, {
    method: "PUT",
  });

  const result = await response.json();
  console.log("Preset applied:", result);
  console.log("Updated projects:", result.projects);
}

// Example: Testing preset delete functionality
async function testDeletePreset(presetId: string) {
  const response = await fetch(`/api/projects/presets/${presetId}`, {
    method: "DELETE",
  });

  const result = await response.json();
  console.log("Preset deleted:", result);
}

// Example: Component with all features
function FullExample() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Preset Manager Demo</h1>
      
      {/* Scenario 1: With projects */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">With Projects</h2>
        <PresetManager
          currentProjects={[
            { id: "1", title: "Film A", order_index: 1 } as Project,
            { id: "2", title: "Film B", order_index: 2 } as Project,
          ]}
          onPresetApplied={() => console.log("Preset applied!")}
        />
      </div>

      {/* Scenario 2: Without projects (button disabled) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Without Projects</h2>
        <PresetManager
          currentProjects={[]}
          onPresetApplied={() => console.log("Preset applied!")}
        />
      </div>
    </div>
  );
}

export { ProjectManagementExample, testSavePreset, testApplyPreset, testDeletePreset, FullExample };
