import { FileText, ChevronDown } from 'lucide-react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import MarkdownRenderer from './MarkdownRenderer'

interface ModelReadmeProps {
  readme: string
  pipeline: string
  modelName: string
}

const ModelReadme = ({ readme, pipeline, modelName}: ModelReadmeProps) => {

  return (
    <div className="mt-2">
      <Disclosure>
        {({ open }) => (
          <>
            <DisclosureButton className="flex justify-between items-center w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                README.md
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-400">
                  <i>{pipeline}</i> • {modelName}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </DisclosureButton>
            <DisclosurePanel className="px-4 py-5 bg-gray-50 rounded-b-lg border-l border-r border-b border-gray-200 max-h-[600px] overflow-y-auto">
              <div className="text-sm text-gray-800">
                <MarkdownRenderer content={readme} />
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  )
}

export default ModelReadme
