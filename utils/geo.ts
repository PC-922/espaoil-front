export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const formatPrice = (price: number): string => {
  return price.toFixed(3);
};
