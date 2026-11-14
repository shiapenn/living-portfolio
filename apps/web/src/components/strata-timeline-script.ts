export const STRATA_TIMELINE_SCRIPT = `
    <script>
      (function() {
        const bands = Array.from(document.querySelectorAll('.strata-band'));
        const cursor = document.getElementById('strata-cursor');
        if (bands.length === 0) return;

        function updateCursor(targetBand) {
          if (!cursor || !targetBand) return;
          const leftPos = targetBand.offsetLeft + (targetBand.offsetWidth / 2);
          cursor.style.left = leftPos + 'px';
        }

        const activeBand = document.querySelector('.strata-band[data-cursor="true"]') ||
                           document.querySelector('.strata-band[data-dimmed="true"]');
        if (activeBand && cursor) {
          updateCursor(activeBand);
        }

        bands.forEach(function(band, idx) {
          band.addEventListener('keydown', function(e) {
            let targetIdx = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              targetIdx = Math.min(bands.length - 1, idx + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              targetIdx = Math.max(0, idx - 1);
            } else if (e.key === 'Home') {
              targetIdx = 0;
            } else if (e.key === 'End') {
              targetIdx = bands.length - 1;
            } else if (e.key === 'PageUp') {
              targetIdx = Math.max(0, idx - 12);
            } else if (e.key === 'PageDown') {
              targetIdx = Math.min(bands.length - 1, idx + 12);
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              band.click();
              return;
            }
            if (targetIdx !== -1 && targetIdx !== idx) {
              e.preventDefault();
              bands[targetIdx].focus();
              updateCursor(bands[targetIdx]);
            }
          });
        });
      })();
    </script>`;
