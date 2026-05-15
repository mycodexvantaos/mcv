import { UIGenerator, createUIGenerator, ComponentConfig, GeneratorOptions } from '../src/index';

describe('UIGenerator', () => {
  let generator: UIGenerator;

  beforeEach(() => {
    generator = new UIGenerator();
  });

  describe('Component Generation', () => {
    it('should generate a React component', () => {
      const config: ComponentConfig = {
        type: 'div',
        props: { className: 'container' },
      };

      const code = generator.generateComponent(config);
      expect(code).toContain('import React');
      expect(code).toContain('className');
      expect(code).toContain('div');
    });

    it('should generate a component with children', () => {
      const config: ComponentConfig = {
        type: 'div',
        children: [
          { type: 'h1', props: { text: 'Title' } },
          { type: 'p', props: { text: 'Content' } },
        ],
      };

      const code = generator.generateComponent(config);
      expect(code).toContain('h1');
      expect(code).toContain('p');
    });

    it('should validate component configuration', () => {
      const validConfig: ComponentConfig = { type: 'div' };
      const invalidConfig: ComponentConfig = { type: '' as any };

      expect(generator.validateConfig(validConfig)).toBe(true);
      expect(generator.validateConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Layout Generation', () => {
    it('should generate a complete layout', () => {
      const layout = {
        name: 'AppLayout',
        components: [
          { type: 'header', props: { title: 'My App' } },
          { type: 'main', props: {} },
          { type: 'footer', props: {} },
        ],
      };

      const code = generator.generateLayout(layout);
      expect(code).toContain('header');
      expect(code).toContain('main');
      expect(code).toContain('footer');
    });
  });

  describe('Framework Support', () => {
    it('should support React framework', () => {
      const options: GeneratorOptions = { framework: 'react' };
      const reactGenerator = new UIGenerator(options);
      const config: ComponentConfig = { type: 'div' };

      const code = reactGenerator.generateComponent(config);
      expect(code).toContain('React');
    });

    it('should support Vue framework', () => {
      const options: GeneratorOptions = { framework: 'vue' };
      const vueGenerator = new UIGenerator(options);
      const config: ComponentConfig = { type: 'div' };

      const code = vueGenerator.generateComponent(config);
      expect(code).toContain('<template>');
      expect(code).toContain('defineProps');
    });

    it('should support Angular framework', () => {
      const options: GeneratorOptions = { framework: 'angular' };
      const angularGenerator = new UIGenerator(options);
      const config: ComponentConfig = { type: 'div' };

      const code = angularGenerator.generateComponent(config);
      expect(code).toContain('@angular/core');
      expect(code).toContain('@Component');
    });
  });

  describe('Factory Function', () => {
    it('should create generator instance', () => {
      const gen = createUIGenerator({ framework: 'react' });
      expect(gen).toBeInstanceOf(UIGenerator);
    });
  });
});
