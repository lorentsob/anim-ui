import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/store/useEditor';
import { customDemo } from '@/effects/customDemo';
import type { ParamValue } from '@/effects/types';

describe('Custom Parameters System', () => {
  beforeEach(() => {
    useEditorStore.setState({
      effectId: customDemo.id,
      params: { ...customDemo.defaults },
    });
  });

  describe('Parameter Types', () => {
    it('should support range parameters', () => {
      const rangeParam = customDemo.params.find(p => p.key === 'intensity');
      expect(rangeParam).toBeDefined();
      expect(rangeParam?.type).toBe('range');

      const defaultValue = customDemo.defaults.intensity as { min: number; max: number };
      expect(defaultValue.min).toBe(10);
      expect(defaultValue.max).toBe(90);
    });

    it('should support vector2 parameters', () => {
      const vector2Param = customDemo.params.find(p => p.key === 'position');
      expect(vector2Param).toBeDefined();
      expect(vector2Param?.type).toBe('vector2');

      const defaultValue = customDemo.defaults.position as { x: number; y: number };
      expect(defaultValue.x).toBe(0);
      expect(defaultValue.y).toBe(0);
    });

    it('should support color parameters', () => {
      const colorParam = customDemo.params.find(p => p.key === 'tintColor');
      expect(colorParam).toBeDefined();
      expect(colorParam?.type).toBe('color');
      if (colorParam?.type === 'color') {
        expect(colorParam.monochrome).toBe(true);
      }

      const defaultValue = customDemo.defaults.tintColor;
      expect(defaultValue).toBe('128');
    });

    it('should support curve parameters', () => {
      const curveParam = customDemo.params.find(p => p.key === 'animationCurve');
      expect(curveParam).toBeDefined();
      expect(curveParam?.type).toBe('curve');

      const defaultValue = customDemo.defaults.animationCurve as { x: number; y: number }[];
      expect(Array.isArray(defaultValue)).toBe(true);
      expect(defaultValue).toHaveLength(4);
      expect(defaultValue[0]).toEqual({ x: 0, y: 0 });
      expect(defaultValue[3]).toEqual({ x: 1, y: 1 });
    });

    it('should support boolean parameters', () => {
      const boolParam = customDemo.params.find(p => p.key === 'enableRotation');
      expect(boolParam).toBeDefined();
      expect(boolParam?.type).toBe('boolean');

      const defaultValue = customDemo.defaults.enableRotation;
      expect(defaultValue).toBe(false);
    });

    it('should support integer parameters', () => {
      const intParam = customDemo.params.find(p => p.key === 'gridSize');
      expect(intParam).toBeDefined();
      expect(intParam?.type).toBe('int');

      const defaultValue = customDemo.defaults.gridSize;
      expect(defaultValue).toBe(20);
    });
  });

  describe('Parameter Value Management', () => {
    it('should handle range parameter updates', () => {
      const { setParam } = useEditorStore.getState();
      const newRange: ParamValue = { min: 20, max: 80 };

      setParam('intensity', newRange);

      const params = useEditorStore.getState().params;
      const intensity = params.intensity as { min: number; max: number };
      expect(intensity.min).toBe(20);
      expect(intensity.max).toBe(80);
    });

    it('should handle vector2 parameter updates', () => {
      const { setParam } = useEditorStore.getState();
      const newPosition: ParamValue = { x: 25, y: -15 };

      setParam('position', newPosition);

      const params = useEditorStore.getState().params;
      const position = params.position as { x: number; y: number };
      expect(position.x).toBe(25);
      expect(position.y).toBe(-15);
    });

    it('should handle curve parameter updates', () => {
      const { setParam } = useEditorStore.getState();
      const newCurve: ParamValue = [
        { x: 0, y: 1 },
        { x: 0.5, y: 0.5 },
        { x: 1, y: 0 },
      ];

      setParam('animationCurve', newCurve);

      const params = useEditorStore.getState().params;
      const curve = params.animationCurve as { x: number; y: number }[];
      expect(curve).toHaveLength(3);
      expect(curve[0]).toEqual({ x: 0, y: 1 });
      expect(curve[2]).toEqual({ x: 1, y: 0 });
    });

    it('should handle color parameter updates', () => {
      const { setParam } = useEditorStore.getState();

      setParam('tintColor', '255');

      const params = useEditorStore.getState().params;
      expect(params.tintColor).toBe('255');
    });

    it('should preserve other parameters when updating one', () => {
      const { setParam } = useEditorStore.getState();
      const originalParams = useEditorStore.getState().params;

      setParam('gridSize', 30);

      const newParams = useEditorStore.getState().params;
      expect(newParams.gridSize).toBe(30);
      expect(newParams.enableRotation).toBe(originalParams.enableRotation);
      expect(newParams.position).toEqual(originalParams.position);
    });
  });

  describe('Parameter Validation', () => {
    it('should maintain parameter type integrity', () => {
      const { setParam } = useEditorStore.getState();

      // Test range parameter validation
      setParam('intensity', { min: 50, max: 70 });
      let params = useEditorStore.getState().params;
      let intensity = params.intensity as { min: number; max: number };
      expect(typeof intensity.min).toBe('number');
      expect(typeof intensity.max).toBe('number');

      // Test vector2 parameter validation
      setParam('position', { x: 10.5, y: -20.3 });
      params = useEditorStore.getState().params;
      let position = params.position as { x: number; y: number };
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');

      // Test curve parameter validation
      const newCurve = [{ x: 0.2, y: 0.8 }, { x: 0.6, y: 0.3 }];
      setParam('animationCurve', newCurve);
      params = useEditorStore.getState().params;
      let curve = params.animationCurve as { x: number; y: number }[];
      expect(Array.isArray(curve)).toBe(true);
      curve.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
      });
    });

    it('should handle invalid parameter values gracefully', () => {
      // This test verifies that the system doesn't crash with invalid values
      // In a real implementation, you might want to add validation
      const { setParam } = useEditorStore.getState();

      // These shouldn't crash the system
      expect(() => {
        setParam('intensity', { min: NaN, max: Infinity });
        setParam('position', { x: undefined as any, y: null as any });
        setParam('animationCurve', [] as any);
      }).not.toThrow();
    });
  });

  describe('Effect Integration', () => {
    it('should provide all required effect properties', () => {
      expect(customDemo.id).toBe('custom-demo');
      expect(customDemo.name).toBe('Custom Parameters Demo');
      expect(Array.isArray(customDemo.params)).toBe(true);
      expect(typeof customDemo.defaults).toBe('object');
      expect(typeof customDemo.init).toBe('function');
      expect(typeof customDemo.update).toBe('function');
      expect(typeof customDemo.render).toBe('function');
    });

    it('should have defaults for all parameters', () => {
      customDemo.params.forEach(param => {
        expect(customDemo.defaults).toHaveProperty(param.key);
      });
    });

    it('should have consistent parameter definitions', () => {
      customDemo.params.forEach(param => {
        expect(param.key).toBeDefined();
        expect(param.type).toBeDefined();
        expect(param.label).toBeDefined();

        // Type-specific validation
        if (param.type === 'range') {
          expect(param.min).toBeDefined();
          expect(param.max).toBeDefined();
        }
        if (param.type === 'vector2' && 'min' in param) {
          expect(typeof param.min).toBe('number');
          expect(typeof param.max).toBe('number');
        }
        if (param.type === 'color' && 'monochrome' in param) {
          expect(typeof param.monochrome).toBe('boolean');
        }
      });
    });
  });
});