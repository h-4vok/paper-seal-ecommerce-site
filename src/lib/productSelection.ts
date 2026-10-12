import type { ArtworkSize } from '../domain/catalogue';

export type ProductSelectionState = {
  selectedSize: ArtworkSize | null;
  activeSlide: number;
};

export const initialProductSelection: ProductSelectionState = {
  selectedSize: null,
  activeSlide: 0,
};

export function selectProductSize(
  state: ProductSelectionState,
  size: ArtworkSize,
  firstSlideIndex: number,
): ProductSelectionState {
  return { ...state, selectedSize: size, activeSlide: firstSlideIndex };
}

export function navigateProductGallery(
  state: ProductSelectionState,
  activeSlide: number,
): ProductSelectionState {
  return { ...state, activeSlide };
}
