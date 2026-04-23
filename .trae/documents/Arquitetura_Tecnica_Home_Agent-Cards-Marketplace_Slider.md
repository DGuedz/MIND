## 1.Architecture design
```mermaid
graph TD
  A["User Browser"] --> B["React Frontend Application (Home)"]
  B --> C["UI State (Vertical selecionada)"]
  B --> D["Fonte de dados atual da Home (já existente no projeto)"]

  subgraph "Frontend Layer"
    B
    C
  end

  subgraph "Data Source (existing)"
    D
  end
```

## 2.Technology Description
- Frontend: React (stack atual do projeto) + CSS (tokens/estilos atuais)
- Backend: None (não requerido para a reformulação visual/estrutural do slider)

## 3.Route definitions
| Route | Purpose |
|---|---|
| / | Home page, contém a seção “Agent Cards Marketplace” reformulada como slider de verticais |
