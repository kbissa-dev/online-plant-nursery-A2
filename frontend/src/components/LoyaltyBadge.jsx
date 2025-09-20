import React from 'react';

const LoyaltyBadge = ({ loyaltyTier, size = 'sm', showDiscount = false }) => {
  const getTierConfig = (tier) => {
    const configs = {
      'green': {
        color: 'bg-gray-200 text-gray-700', 
        name: 'Green',
        discount: 0
      },
      'silver': { 
        color: 'bg-gray-300 text-gray-800', 
        name: 'Silver',
        discount: 5
      },
      'gold': { 
        color: 'bg-yellow-300 text-yellow-900', 
        name: 'Gold',
        discount: 10
      },
      'platinum': { 
        color: 'bg-purple-300 text-purple-900', 
        name: 'Platinum',
        discount: 15
      }
    };
    return configs[tier] || configs['green'];
  };

  const config = getTierConfig(loyaltyTier);
  const sizeClasses = {
    'xs': 'px-2 py-1 text-xs',
    'sm': 'px-3 py-1 text-sm', 
    'md': 'px-4 py-2 text-base',
    'lg': 'px-6 py-3 text-lg'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${config.color} ${sizeClasses[size]}`}>
      {config.name}
      {showDiscount && config.discount > 0 && (
        <span className="ml-1 opacity-75">({config.discount}% off)</span>
      )}
    </span>
  );
};

export default LoyaltyBadge;