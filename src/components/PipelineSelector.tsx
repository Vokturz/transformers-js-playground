import React from 'react';
import {
  Listbox,
  ListboxOption,
  ListboxButton,
  ListboxOptions,
  Transition
} from '@headlessui/react'
import { ChevronDown, Check } from 'lucide-react';

const pipelines = [
  'text-classification',
  'zero-shot-classification',
  'text-generation',
  'summarization',
  'feature-extraction',
  'sentiment-analysis',
  'image-classification',
  'question-answering',
  'translation'
];

interface PipelineSelectorProps {
  pipeline: string;
  setPipeline: (pipeline: string) => void;
}

const PipelineSelector: React.FC<PipelineSelectorProps> = ({
  pipeline,
  setPipeline
}) => {
  const selectedPipeline = pipeline;

  const formatPipelineName = (pipelineId: string) => {
    return pipelineId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="relative">
      <Listbox value={selectedPipeline} onChange={setPipeline}>
        <div className="relative">
          <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-300">
            <span className="block truncate font-medium">
              {formatPipelineName(selectedPipeline)}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-5 w-5 text-gray-400 ui-open:rotate-180 transition-transform"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
          
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {pipelines.map((p) => (
                <ListboxOption
                  key={p}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 px-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    }`
                  }
                  value={p}
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {formatPipelineName(p)}
                      </span>
                      {selected && (
                        <span className="flex items-center text-amber-600">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default PipelineSelector;
