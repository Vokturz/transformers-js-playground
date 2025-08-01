import { useModel } from '../contexts/ModelContext'
import { TextGenerationProvider } from '../contexts/TextGenerationContext'
import { FeatureExtractionProvider } from '../contexts/FeatureExtractionContext'
import { ZeroShotClassificationProvider } from '../contexts/ZeroShotClassificationContext'
import { ImageClassificationProvider } from '../contexts/ImageClassificationContext'

export const PipelineLayout = ({ children }: { children: React.ReactNode }) => {
  const { pipeline } = useModel()

  switch (pipeline) {
    case 'text-generation':
      return <TextGenerationProvider>{children}</TextGenerationProvider>

    case 'feature-extraction':
      return <FeatureExtractionProvider>{children}</FeatureExtractionProvider>

    case 'zero-shot-classification':
      return (
        <ZeroShotClassificationProvider>
          {children}
        </ZeroShotClassificationProvider>
      )

    case 'image-classification':
      return (
        <ImageClassificationProvider>{children}</ImageClassificationProvider>
      )

    default:
      return <>{children}</>
  }
}
