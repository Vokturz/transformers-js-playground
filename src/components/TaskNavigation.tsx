import {
  ScanSearch,
  Image,
  MessageSquare,
  BarChart3,
  Volume2,
  Tags
} from 'lucide-react'
import { useModel } from '../contexts/ModelContext'

const tasks = [
  {
    id: 'feature-extraction',
    name: 'Embeddings',
    description: 'Compare meaning',
    icon: ScanSearch
  },
  {
    id: 'image-classification',
    name: 'Images',
    description: 'Recognize objects',
    icon: Image
  },
  {
    id: 'text-generation',
    name: 'Generate',
    description: 'Write & chat',
    icon: MessageSquare
  },
  {
    id: 'text-classification',
    name: 'Sentiment',
    description: 'Classify text',
    icon: BarChart3
  },
  {
    id: 'text-to-speech',
    name: 'Speech',
    description: 'Turn text into audio',
    icon: Volume2
  },
  {
    id: 'zero-shot-classification',
    name: 'Categories',
    description: 'Use your own labels',
    icon: Tags
  }
]

export function TaskNavigation() {
  const { pipeline, setPipeline } = useModel()
  return (
    <nav
      aria-label="Choose a task"
      className="mb-6 grid grid-cols-3 gap-2 xl:grid-cols-6"
    >
      {tasks.map(({ id, name, description, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setPipeline(id)}
          aria-pressed={pipeline === id}
          className={`group rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${pipeline === id ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40'}`}
        >
          <Icon className="mb-3 h-4 w-4" />
          <span className="block text-sm font-semibold">{name}</span>
          <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
            {description}
          </span>
        </button>
      ))}
    </nav>
  )
}
