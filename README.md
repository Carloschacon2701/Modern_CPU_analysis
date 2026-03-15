# CPU Analyzer

Plataforma de análisis de ejecución en tiempo real que permite observar cómo interactúan la **CPU**, la **memoria** y los **dispositivos de entrada/salida** durante la ejecución de un proceso. Desarrollada como proyecto académico para el curso de Organización del Computador (Semestre 2025-3).

---

## Propósito

Los sistemas modernos — desde servidores en la nube hasta infraestructuras de entrenamiento de IA — requieren visibilidad detallada sobre el comportamiento del hardware durante la ejecución de programas. Esta plataforma permite:

- Observar en tiempo real cómo el sistema operativo distribuye carga entre núcleos de CPU
- Medir presión de memoria y latencia simulada según el nivel de uso
- Analizar operaciones de disco y red con tasas de transferencia actualizadas cada segundo
- Inspeccionar procesos activos, sus hilos y su prioridad
- Ejecutar cargas de trabajo sintéticas (algoritmos CPU intensivos, operaciones de memoria, workloads de IA) y observar su impacto directo en las métricas del sistema

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│              Navegador (Next.js 16)                 │
│  Páginas: CPU · Memoria · I/O · Procesos ·          │
│           Simulación · Logs · Tecnologías           │
│  Estado: Zustand (ventanas deslizantes de 60s)      │
└──────────────┬──────────────────────────────────────┘
               │  WebSocket /ws/metrics  (push 1 Hz)
               │  HTTP /api/*            (REST)
               │
┌──────────────▼──────────────────────────────────────┐
│         Backend Python (FastAPI + Uvicorn)          │
│                                                     │
│  Collector Loop (cada 1 segundo)                    │
│   ├── cpu_monitor    → CpuSnapshot                  │
│   ├── memory_monitor → MemorySnapshot               │
│   ├── io_monitor     → IoSnapshot                   │
│   └── process_monitor → ProcessEntry[]              │
│                                                     │
│  Simulation Runner (ThreadPoolExecutor)             │
│   ├── cpu_workload   (criba de Eratóstenes,         │
│   │                   Fibonacci, QuickSort)          │
│   ├── memory_workload (acceso secuencial/aleatorio) │
│   ├── ai_workload    (multiplicación de matrices,   │
│   │                   K-Means, red neuronal XOR)    │
│   └── parallel_workload (multi-hilo)                │
│                                                     │
│  Broadcaster WebSocket (asyncio fan-out)            │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │  psutil (OS)        │  NumPy (cómputo)
          │  /proc · sysctl     │  BLAS · álgebra lineal
          └─────────────────────┘
```

---

## Stack tecnológico

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| Python | 3.9 | Lenguaje principal del backend |
| FastAPI | 0.115 | Framework web async, REST + WebSocket |
| Uvicorn | 0.30 | Servidor ASGI |
| psutil | 6.0 | Lectura de métricas del sistema operativo |
| NumPy | ≥1.24 | Cargas de trabajo de IA (matrices, K-Means, red neuronal) |
| Pydantic | 2.9 | Validación y serialización de modelos de datos |

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 16 | Framework React con App Router |
| TypeScript | 5 | Tipado estático, contrato con el backend |
| Zustand | 5 | Manejo de estado global (ventanas deslizantes) |
| Recharts | 3 | Gráficos de series de tiempo, gauges radiales |
| Tailwind CSS | 4 | Estilos utilitarios, tema oscuro |
| next-intl | 4 | Internacionalización (Español / Inglés) |

---

## Requisitos previos

- **Python 3.9+**
- **Node.js 18+** y **npm**
- Sistema operativo: macOS o Linux

---

## Instalación y ejecución

### Opción 1 — Script automático (recomendado)

Desde la raíz del proyecto:

```bash
chmod +x start.sh
./start.sh
```

El script crea el entorno virtual de Python, instala todas las dependencias e inicia ambos servidores automáticamente.

### Opción 2 — Manual

**Backend:**
```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend** (en otra terminal):
```bash
cd frontend
npm install
npm run dev
```

### URLs disponibles

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:3000 |
| API REST backend | http://localhost:8000 |
| Documentación OpenAPI (Swagger) | http://localhost:8000/docs |
| Documentación ReDoc | http://localhost:8000/redoc |

---

## Funcionalidades

### Monitoreo en tiempo real
- **CPU:** utilización total y por núcleo, frecuencia (actual / mín / máx), tiempo de usuario/sistema/idle/iowait, instrucciones estimadas, cambios de contexto
- **Memoria:** uso de RAM y swap, operaciones de lectura/escritura por segundo, latencia DRAM simulada según curva de presión (80 ns → 400 ns)
- **I/O:** throughput y operaciones por segundo de disco y red, dispositivos simulados con latencia y actividad
- **Procesos:** lista de procesos activos con CPU%, memoria%, número de hilos, prioridad y detalle de threads

### Simulación de cargas de trabajo
Nueve tipos de workload ejecutables con intensidad (1–10) y duración (5–120 segundos) configurables:

| Identificador | Descripción |
|---|---|
| `cpu_prime` | Criba de Eratóstenes |
| `cpu_fibonacci` | Cálculo de Fibonacci |
| `cpu_sort` | QuickSort sobre arreglos grandes |
| `memory_sequential` | Acceso secuencial a memoria |
| `memory_random` | Acceso aleatorio a memoria |
| `parallel` | Carga multi-hilo |
| `ai_matrix` | Multiplicación de matrices (NumPy BLAS) |
| `ai_kmeans` | Algoritmo K-Means (Lloyd's) |
| `ai_nn` | Red neuronal XOR con backpropagation manual |

### Otras características
- **Logs de ejecución:** registro de eventos con nivel, módulo y timestamp
- **Internacionalización:** interfaz completa en Español e Inglés (selector en la barra superior)
- **Página de tecnologías:** documentación interactiva del stack disponible en la propia aplicación en `/technologies`

---

## API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `GET` | `/api/metrics/snapshot` | Última métrica capturada |
| `GET` | `/api/metrics/history?limit=60` | Historial de hasta 300 snapshots |
| `POST` | `/api/simulation/start` | Iniciar una carga de trabajo |
| `POST` | `/api/simulation/stop/{run_id}` | Detener una ejecución |
| `GET` | `/api/simulation/status/{run_id}` | Estado de una ejecución |
| `GET` | `/api/simulation/runs` | Todas las ejecuciones registradas |
| `GET` | `/api/simulation/workloads` | Tipos de workload disponibles |
| `GET` | `/api/simulation/impact/{run_id}` | Serie temporal del impacto en métricas |
| `GET` | `/api/logs` | Ring buffer de logs de ejecución |
| `WS` | `/ws/metrics` | Stream en tiempo real (métricas + eventos) |

---

## Pruebas

### Backend (pytest)
```bash
cd backend
.venv/bin/pip install -r requirements-test.txt
.venv/bin/python -m pytest tests/ -v
```

Cubre: modelos Pydantic, utilidades de tiempo, monitor de CPU (con psutil mockeado), ring buffer del collector, endpoints REST de métricas y simulación, broadcaster WebSocket.

### Frontend (Vitest)
```bash
cd frontend
npm test
```

Cubre: funciones de formato (`formatBytes`, `formatDuration`, `formatNumber`, etc.), store Zustand (`pushSnapshot`, ventanas deslizantes, eventos de simulación).

---

## Estructura del proyecto

```
cpu-analyzer/
├── start.sh                  # Script de inicio automático
├── backend/
│   ├── main.py               # Punto de entrada FastAPI
│   ├── requirements.txt      # Dependencias de producción
│   ├── requirements-test.txt # Dependencias de pruebas
│   ├── api/                  # Rutas REST
│   ├── core/                 # Collector, broadcaster, scheduler
│   ├── models/               # Esquemas Pydantic
│   ├── monitors/             # CPU, memoria, I/O, procesos
│   ├── simulation/           # Workloads y runner
│   ├── utils/                # Logger, utilidades de tiempo
│   └── tests/                # Suite de pruebas (pytest)
└── frontend/
    ├── app/[locale]/         # Páginas (App Router con i18n)
    ├── components/           # Gráficos, paneles, layout, simulación
    ├── hooks/                # useMetricsStore, useWebSocket
    ├── lib/                  # Tipos TypeScript, utilidades, constantes
    ├── messages/             # Traducciones (en.json, es.json)
    └── __tests__/            # Suite de pruebas (Vitest)
```
