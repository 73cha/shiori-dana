<article class="scope card">
  <div class="_img-wrap">
    <div class="skeleton-img"></div>
  </div>

  <div class="_title">
    <div class="skeleton-title"></div>
  </div>

  <div class="_date">
    <div class="skeleton-date"></div>
  </div>

  <div class="_description">
    <div class="skeleton-text"></div>
    <div class="skeleton-text"></div>
    <div class="skeleton-text"></div>
  </div>

  <div class="_tags">
    <div class="skeleton-tag"></div>
    <div class="skeleton-tag"></div>
    <div class="skeleton-tag"></div>
  </div>

  <div class="_buttons">
    <div class="skeleton-button"></div>
    <div class="skeleton-button"></div>
  </div>
</article>

<style>
  @keyframes shimmer {
    0% {
      background-position-x: 100%;
    }
    100% {
      background-position-x: -100%;
    }
  }

  [class*='skeleton-'] {
    background: linear-gradient(
      90deg,
      oklch(25.539% 0.00365 106.785) 25%,
      oklch(30.045% 0.00351 106.765) 50%,
      oklch(25.539% 0.00365 106.785) 75%
    );
    background-size: 200% 100%;
    background-position-x: 100%;
    animation: shimmer 1.6s infinite;

    &:not([class*='skeleton-img']) {
      border-radius: var(--radius-pill);
    }
  }

  .skeleton-img {
    --_aspect-ratio: 1200 / 630;

    aspect-ratio: var(--_aspect-ratio);
  }

  .skeleton-title {
    block-size: 1em;
  }

  .skeleton-date {
    inline-size: calc(96 / 16 * 1em);
    block-size: calc(12 / 16 * 1em);
  }

  .skeleton-text {
    block-size: calc(12 / 16 * 1em);

    + .skeleton-text {
      margin-block-start: 0.5em;
    }
  }

  .skeleton-tag {
    inline-size: calc(48 / 16 * 1em);
    block-size: calc(14 / 16 * 1em);
  }

  .skeleton-button {
    inline-size: calc(64 / 16 * 1em);
    block-size: 1.5em;
  }
</style>
