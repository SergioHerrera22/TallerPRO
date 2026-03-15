# Sitio web de taller de autos

Este sistema permite la gestión integral de un taller de autos, incluyendo registro de vehículos, órdenes de trabajo, gastos, cuentas, cheques y estadísticas de lavados. El diseño original está disponible en [Figma](https://www.figma.com/design/E7LxMQxiAJLNYvqmzKLqa7/Sitio-web-de-taller-de-autos).

## Instalación y ejecución

1. Instala las dependencias:


    ```
    npm install
    ```

2. Inicia el servidor de desarrollo:


    ```
    npm run dev
    ```

## Dependencias principales

- React
- Vite
- TailwindCSS
- Lucide-react (iconos)
- Sonner (notificaciones)

## Funcionalidades principales

### Dashboard

- Busca vehículos por patente.
- Registra nuevos vehículos.
- Muestra estadísticas y últimos vehículos registrados.

### Detalle de Vehículo

- Visualiza el historial de servicios y datos del vehículo.

### Órdenes de Trabajo

- Gestiona órdenes de trabajo para cada vehículo.
- Registra servicios realizados y lavados.

### Gastos

- Registra y visualiza gastos generales del taller.
- Filtra y ordena gastos por fecha.

### Gestión Financiera

- Administra gastos de proveedores y cuentas corrientes.

### Cuentas Corrientes

- Visualiza movimientos y saldo de cuentas.

### Gestión de Cheques

- Registra y administra cheques emitidos y recibidos.

### Estadísticas de Lavados

- Muestra estadísticas mensuales de lavados realizados.

## Instrucciones de uso

### Registrar un vehículo

1. Accede al Dashboard.
2. Ingresa la patente en el campo de búsqueda.
3. Si el vehículo no existe, haz clic en "Registrar este vehículo" y completa el formulario.
4. El vehículo quedará guardado y aparecerá en la lista de recientes.

### Consultar historial de un vehículo

1. Busca la patente en el Dashboard.
2. Haz clic sobre el vehículo para ver su detalle y servicios realizados.

### Crear una orden de trabajo

1. Ve a la sección "Órdenes de Trabajo".
2. Haz clic en "Nueva Orden" y completa los datos del servicio.
3. La orden se asociará al vehículo correspondiente.

### Registrar gastos

1. Ve a la sección "Gastos".
2. Haz clic en "Nuevo Gasto" y completa el formulario.
3. El gasto se guardará y aparecerá en la lista.

### Gestionar cuentas corrientes y cheques

1. Accede a "Cuentas Corrientes" o "Gestión de Cheques".
2. Registra movimientos, cheques emitidos o recibidos según corresponda.

### Ver estadísticas de lavados

1. Ve a "Estadísticas de Lavados".
2. Consulta el resumen mensual y el historial de lavados.

## Estructura del sistema

- **src/app/pages/**: Páginas principales del sistema.
- **src/app/components/**: Componentes reutilizables (formularios, UI, modales).
- **src/app/types/**: Tipos y modelos de datos.
- **src/app/routes.tsx**: Configuración de rutas y navegación.
- **src/db.js**: Persistencia local (localStorage).

## Almacenamiento

El sistema utiliza `localStorage` para guardar vehículos, órdenes, gastos, cheques y cuentas. No requiere backend.

## Estilo y UI

- Utiliza componentes personalizados y estilos modernos.
- Incluye notificaciones y diálogos para interacción amigable.

## Créditos

Consulta el archivo ATTRIBUTIONS.md para ver las librerías y recursos utilizados.
