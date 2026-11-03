

"use client";

const components = [
  {
    type: "client",
    label: "Client",
    description: "Incoming request source",
    icon: "👤",
  },
  {
    type: "loadBalancer",
    label: "Load Balancer",
    description: "Distributes incoming traffic",
    icon: "⚖️",
  },
  {
    type: "server",
    label: "Server",
    description: "Processes application requests",
    icon: "🖥️",
  },
  {
    type: "cache",
    label: "Cache",
    description: "Stores frequently accessed data",
    icon: "⚡",
  },
  {
    type: "database",
    label: "Database",
    description: "Stores application data",
    icon: "🗄️",
  },
];

export default function ComponentSidebar({ onAddComponent }) {
  const onDragStart = (event, component) => {
    event.dataTransfer.setData(
      "application/codecanvas",
      JSON.stringify(component)
    );

    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="cc-sidebar">
      <div className="cc-sidebar-heading">
        <div>
          <h3>Components</h3>
          <p>Architecture building blocks</p>
        </div>
        <span className="cc-component-count">{components.length}</span>
      </div>

      <div className="cc-sidebar-section-label">
        AVAILABLE COMPONENTS
      </div>

      <div className="cc-component-list">
        {components.map((component) => (
          <button
            key={component.type}
            type="button"
            draggable
            onClick={() => onAddComponent(component)}
            onDragStart={(event) => onDragStart(event, component)}
            className="cc-component-card"
            title={`Click or drag to add ${component.label}`}
          >
            <span className="cc-component-icon">
              {component.icon}
            </span>

            <span className="cc-component-info">
              <strong>{component.label}</strong>
              <small>{component.description}</small>
            </span>

            <span className="cc-component-add">+</span>
          </button>
        ))}
      </div>

      <div className="cc-sidebar-tip">
        <span>💡</span>
        <div>
          <strong>Quick tip</strong>
          <p>Drag a component onto the canvas or click to add it.</p>
        </div>
      </div>
    </aside>
  );
}