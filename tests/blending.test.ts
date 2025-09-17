import { describe, it, expect, beforeEach } from 'vitest';
import { useBlendingStore } from '@/store/useBlending';
import { BLEND_MODES } from '@/lib/blending';
import type { BlendMode } from '@/effects/types';

describe('Blending System', () => {
  beforeEach(() => {
    useBlendingStore.setState({
      blendingEnabled: false,
      layers: [
        {
          id: 'layer-1',
          effectId: 'square-drift',
          opacity: 1.0,
          blendMode: 'normal',
          enabled: true,
          params: {},
        },
      ],
    });
  });

  describe('Blending Store', () => {
    it('should initialize with default state', () => {
      const state = useBlendingStore.getState();
      expect(state.blendingEnabled).toBe(false);
      expect(state.layers).toHaveLength(1);
      expect(state.layers[0].blendMode).toBe('normal');
      expect(state.layers[0].opacity).toBe(1.0);
      expect(state.layers[0].enabled).toBe(true);
    });

    it('should toggle blending mode', () => {
      const { toggleBlending } = useBlendingStore.getState();

      toggleBlending();
      expect(useBlendingStore.getState().blendingEnabled).toBe(true);

      toggleBlending();
      expect(useBlendingStore.getState().blendingEnabled).toBe(false);
    });

    it('should add new layers', () => {
      const { addLayer } = useBlendingStore.getState();

      addLayer();
      const state = useBlendingStore.getState();
      expect(state.layers).toHaveLength(2);
      expect(state.layers[1].blendMode).toBe('normal');
      expect(state.layers[1].opacity).toBe(1.0);
      expect(state.layers[1].enabled).toBe(true);
    });

    it('should remove layers', () => {
      const { addLayer, removeLayer } = useBlendingStore.getState();

      addLayer();
      addLayer();
      expect(useBlendingStore.getState().layers).toHaveLength(3);

      const layerId = useBlendingStore.getState().layers[1].id;
      removeLayer(layerId);
      expect(useBlendingStore.getState().layers).toHaveLength(2);
    });

    it('should update layer properties', () => {
      const { updateLayer } = useBlendingStore.getState();
      const layerId = useBlendingStore.getState().layers[0].id;

      updateLayer(layerId, {
        blendMode: 'multiply',
        opacity: 0.5,
        enabled: false,
      });

      const layer = useBlendingStore.getState().layers[0];
      expect(layer.blendMode).toBe('multiply');
      expect(layer.opacity).toBe(0.5);
      expect(layer.enabled).toBe(false);
    });

    it('should duplicate layers', () => {
      const { updateLayer, duplicateLayer } = useBlendingStore.getState();
      const originalId = useBlendingStore.getState().layers[0].id;

      // Configure original layer
      updateLayer(originalId, {
        blendMode: 'multiply',
        opacity: 0.7,
        effectId: 'ascii-dither',
      });

      duplicateLayer(originalId);

      const state = useBlendingStore.getState();
      expect(state.layers).toHaveLength(2);

      const duplicate = state.layers[1];
      expect(duplicate.blendMode).toBe('multiply');
      expect(duplicate.opacity).toBe(0.7);
      expect(duplicate.effectId).toBe('ascii-dither');
      expect(duplicate.id).not.toBe(originalId);
    });

    it('should reorder layers', () => {
      const { addLayer, reorderLayer } = useBlendingStore.getState();

      addLayer();
      addLayer();

      const originalOrder = useBlendingStore.getState().layers.map(l => l.id);

      reorderLayer(0, 2);

      const newOrder = useBlendingStore.getState().layers.map(l => l.id);
      expect(newOrder[0]).toBe(originalOrder[1]);
      expect(newOrder[1]).toBe(originalOrder[2]);
      expect(newOrder[2]).toBe(originalOrder[0]);
    });

    it('should clear all layers', () => {
      const { addLayer, clearAllLayers } = useBlendingStore.getState();

      addLayer();
      addLayer();
      expect(useBlendingStore.getState().layers).toHaveLength(3);

      clearAllLayers();
      expect(useBlendingStore.getState().layers).toHaveLength(1);
    });
  });

  describe('Blend Mode Constants', () => {
    it('should provide all blend modes', () => {
      expect(BLEND_MODES).toHaveLength(6);

      const modes = BLEND_MODES.map(m => m.value);
      expect(modes).toContain('normal');
      expect(modes).toContain('multiply');
      expect(modes).toContain('add');
      expect(modes).toContain('subtract');
      expect(modes).toContain('xor');
      expect(modes).toContain('overlay');
    });

    it('should provide human-readable labels', () => {
      const normalMode = BLEND_MODES.find(m => m.value === 'normal');
      expect(normalMode?.label).toBe('Normal');

      const multiplyMode = BLEND_MODES.find(m => m.value === 'multiply');
      expect(multiplyMode?.label).toBe('Multiply');
    });

    it('should have valid blend mode types', () => {
      const validModes: BlendMode[] = ['normal', 'multiply', 'add', 'subtract', 'xor', 'overlay'];

      BLEND_MODES.forEach(mode => {
        expect(validModes).toContain(mode.value);
      });
    });
  });

  describe('Layer Validation', () => {
    it('should create layers with valid default properties', () => {
      const { addLayer } = useBlendingStore.getState();

      addLayer();
      const layer = useBlendingStore.getState().layers[1];

      expect(layer.id).toBeDefined();
      expect(layer.id).toMatch(/^layer-\d+-\d+$/);
      expect(layer.effectId).toBeDefined();
      expect(typeof layer.opacity).toBe('number');
      expect(layer.opacity).toBeGreaterThanOrEqual(0);
      expect(layer.opacity).toBeLessThanOrEqual(1);
      expect(layer.enabled).toBe(true);
      expect(['normal', 'multiply', 'add', 'subtract', 'xor', 'overlay']).toContain(layer.blendMode);
    });

    it('should maintain layer integrity during operations', () => {
      const { addLayer, updateLayer, duplicateLayer } = useBlendingStore.getState();

      // Add and configure layers
      addLayer();
      addLayer();

      const layers = useBlendingStore.getState().layers;
      const layer1Id = layers[1].id;
      const layer2Id = layers[2].id;

      updateLayer(layer1Id, { blendMode: 'multiply', opacity: 0.5 });
      updateLayer(layer2Id, { blendMode: 'add', opacity: 0.8 });

      // Duplicate and verify integrity
      duplicateLayer(layer1Id);

      const finalState = useBlendingStore.getState();
      expect(finalState.layers).toHaveLength(4);

      // Check that all layers have unique IDs
      const ids = finalState.layers.map(l => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});