/**
 * @typedef {Object} SkeletonRowOptions
 * @property {'rounded-full' | 'rounded-xl'} [avatarShape]  - Forma del avatar placeholder.
 * @property {string}  [avatarSize]   - Clases de tamaño del avatar (e.g. 'h-10 w-10').
 * @property {string}  [titleWidth]   - Ancho del bloque de título (e.g. 'w-32').
 * @property {string}  [subtitleWidth] - Ancho del bloque de subtítulo (e.g. 'w-20').
 * @property {string}  [actionSize]   - Tamaño del bloque de acción derecho (e.g. 'h-8 w-20').
 * @property {'rounded-lg' | 'rounded-full'} [actionShape] - Forma del bloque de acción.
 * @property {string}  [padding]      - Clases de padding del contenedor (e.g. 'px-1 py-3').
 */

/**
 * Renders a generic skeleton placeholder row (avatar + text lines + action block).
 * Suitable for any list that shows a loading state before real data arrives.
 *
 * @param {SkeletonRowOptions} [options]
 * @returns {string}
 */
const SkeletonRow = ({
  avatarShape = 'rounded-full',
  avatarSize = 'h-10 w-10',
  titleWidth = 'w-32',
  subtitleWidth = 'w-20',
  actionSize = 'h-8 w-20',
  actionShape = 'rounded-lg',
  padding = 'px-1 py-3',
} = {}) => `
  <div class="flex items-center gap-4 ${padding} animate-pulse" aria-hidden="true">
    <div class="skeleton-shimmer ${avatarSize} ${avatarShape} shrink-0"></div>
    <div class="flex flex-col gap-2 flex-1">
      <div class="skeleton-shimmer h-4 ${titleWidth} rounded-full"></div>
      <div class="skeleton-shimmer h-3 ${subtitleWidth} rounded-full opacity-60"></div>
    </div>
    <div class="skeleton-shimmer ${actionSize} ${actionShape} shrink-0"></div>
  </div>
`;

export default SkeletonRow;
