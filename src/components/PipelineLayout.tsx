import { useModel } from '../contexts/ModelContext'
import { TextGenerationProvider } from '../contexts/TextGenerationContext'

export const PipelineLayout = ({ children }: { children: React.ReactNode }) => {
  const { pipeline } = useModel()

  switch (pipeline) {
    case 'text-generation':
      return <TextGenerationProvider>{children}</TextGenerationProvider>

    // case 'zero-shot-classification':
    //   return <ZeroShotProvider>{children}</ZeroShotProvider>;

    default:
      return <>{children}</>
  }
}
