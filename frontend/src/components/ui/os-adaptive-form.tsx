'use client';

import { useState } from 'react';
import { OSTypeSelector, TipoOS } from './os-type-selector';
import { OSWizard } from './os-wizard';

type FormStep = 'type-selection' | 'wizard';

export function OSAdaptiveForm() {
  const [currentStep, setCurrentStep] = useState<FormStep>('type-selection');
  const [selectedType, setSelectedType] = useState<TipoOS | undefined>();

  const handleTypeSelection = (tipo: TipoOS) => {
    setSelectedType(tipo);
    setCurrentStep('wizard');
  };

  const handleBackToTypeSelection = () => {
    setCurrentStep('type-selection');
    setSelectedType(undefined);
  };

  if (currentStep === 'type-selection') {
    return <OSTypeSelector onSelectType={handleTypeSelection} selectedType={selectedType} />;
  }

  if (currentStep === 'wizard' && selectedType) {
    return <OSWizard tipoOS={selectedType} onBack={handleBackToTypeSelection} />;
  }

  return null;
}
