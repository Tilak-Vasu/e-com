// src/components/products/carousel/ProductCarousel.tsx

import React, { useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import './ProductCarousel.css';

import { type Product } from '../../api/types';
import RecommendedProductCard from '../products/RecommendedProductCard';

interface ProductCarouselProps {
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
    loop: false,
    mode: 'free-snap',
    slides: { perView: 2, spacing: 15 },
    breakpoints: {
      '(min-width: 768px)': { slides: { perView: 3, spacing: 20 } },
      '(min-width: 1024px)': { slides: { perView: 4, spacing: 20 } },
      '(min-width: 1280px)': { slides: { perView: 5, spacing: 24 } },
    },
  });

  if (!products || products.length === 0) {
    return null;
  }

  // 🔒 If 5 or fewer products, disable both arrows
  const lockAll = products.length <= 5;

  // Compute slide constraints
  const details = instanceRef.current?.track?.details;
  const totalSlides = details?.slides.length ?? 0;
  
  // --- UPDATED LINE ---
  // Get the perView from the slider's options, which correctly reflects the active breakpoint.
  const perView = instanceRef.current?.options.slides.perView ?? 1;

  // 🔑 Next should lock when last product is visible
  const isNextDisabled = lockAll || currentSlide >= totalSlides - perView;

  const isPrevDisabled = lockAll || currentSlide === 0;

  return (
    <div className="carousel-wrapper">
      <div ref={sliderRef} className="keen-slider">
        {products.map((product) => (
          <div key={product.id} className="keen-slider__slide product-slide">
            <RecommendedProductCard product={product} />
          </div>
        ))}
      </div>

      {loaded && instanceRef.current && (
        <>
          <button
            className="arrow arrow--left"
            onClick={(e) => {
              e.stopPropagation();
              instanceRef.current?.prev();
            }}
            disabled={isPrevDisabled}
          >
            &#8592;
          </button>
          <button
            className="arrow arrow--right"
            onClick={(e) => {
              e.stopPropagation();
              instanceRef.current?.next();
            }}
            disabled={isNextDisabled}
          >
            &#8594;
          </button>
        </>
      )}
    </div>
  );
};

export default ProductCarousel;