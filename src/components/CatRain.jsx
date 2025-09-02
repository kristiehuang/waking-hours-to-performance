import React, { useEffect } from 'react';

function CatRain({ rating }) {
  useEffect(() => {
    // Select cat emojis based on trading day rating
    let catEmojis;
    
    if (rating > 6.5) {
      // Great day! Happy cats
      catEmojis = ['😹', '😻', '😼'];
    } else if (rating < 5) {
      // Tough day... sad/surprised cats
      catEmojis = ['🙀', '😿', '😽'];
    } else {
      // Average day, neutral cats
      catEmojis = ['😺', '😸'];
    }
    
    // Create multiple cats for confetti effect
    const numberOfCats = 20; // Always maximum cats!
    const cats = [];
    
    for (let i = 0; i < numberOfCats; i++) {
      setTimeout(() => {
        // Pick a random cat emoji
        const randomCat = catEmojis[Math.floor(Math.random() * catEmojis.length)];
        
        // Create the emoji element
        const catDiv = document.createElement('div');
        catDiv.textContent = randomCat;
        
        // Random properties for variety
        const size = 2 + Math.random() * 2; // Size between 2-4rem
        const duration = 2.5 + Math.random() * 2; // Duration between 2.5-4.5s
        const delay = Math.random() * 0.3; // Small random delay
        const animation = Math.random() > 0.5 ? 'catFall' : 'catFallSwaying'; // Mix of animations
        
        catDiv.style.cssText = `
          position: fixed;
          font-size: ${size}rem;
          top: -100px;
          left: ${Math.random() * window.innerWidth}px;
          z-index: 9999;
          animation: ${animation} ${duration}s ease-in ${delay}s forwards;
          pointer-events: none;
        `;
        
        // Add the cat to the page
        document.body.appendChild(catDiv);
        cats.push(catDiv);
        
        // Remove the cat after animation completes
        setTimeout(() => {
          if (catDiv.parentNode) {
            document.body.removeChild(catDiv);
          }
        }, (duration + delay) * 1000 + 100);
      }, i * 50); // Stagger the creation for a cascade effect
    }
    
    // Cleanup function
    return () => {
      cats.forEach(cat => {
        if (cat.parentNode) {
          document.body.removeChild(cat);
        }
      });
    };
  }, [rating]);

  return null; // This component doesn't render anything itself
}

export default CatRain;


