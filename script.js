
        // Create fairy lights
        function createFairyLights() {
            for (let i = 0; i < 50; i++) {
                const light = document.createElement('div');
                light.className = 'fairy-light';
                light.style.left = `${Math.random() * 100}%`;
                light.style.top = `${Math.random() * 100}%`;
                light.style.animationDelay = `${Math.random() * 3}s`;
                document.body.appendChild(light);
            }
        }
        createFairyLights();

        // Add bokeh effect on mouse move
        document.addEventListener('mousemove', (e) => {
            const bokeh = document.createElement('div');
            bokeh.className = 'fairy-light';
            bokeh.style.left = `${e.clientX}px`;
            bokeh.style.top = `${e.clientY}px`;
            bokeh.style.transform = `scale(${Math.random() * 2 + 1})`;
            document.body.appendChild(bokeh);
            setTimeout(() => bokeh.remove(), 1000);
        });