import { useModel } from '../contexts/ModelContext'
import { TextGenerationProvider } from '../contexts/TextGenerationContext'
import { FeatureExtractionProvider } from '../contexts/FeatureExtractionContext'

export const PipelineLayout = ({ children }: { children: React.ReactNode }) => {
  const { pipeline } = useModel()

  switch (pipeline) {
    case 'text-generation':
      return <TextGenerationProvider>{children}</TextGenerationProvider>

    case 'feature-extraction':
      return <FeatureExtractionProvider>{children}</FeatureExtractionProvider>

    // case 'zero-shot-classification':
    //   return <ZeroShotProvider>{children}</ZeroShotProvider>;

    default:
      return <>{children}</>
  }
}
