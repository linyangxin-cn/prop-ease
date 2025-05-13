import React from 'react';
import { CategorizingProvider } from './context/CategorizingContext';
import PropertyDetail from './index';

const PropertyDetailWithContext: React.FC = () => {
  return (
    <CategorizingProvider>
      <PropertyDetail />
    </CategorizingProvider>
  );
};

export default PropertyDetailWithContext;
