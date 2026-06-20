import { ModelElement } from '@/types';
import { getDisciplineName } from './disciplineColors';

export interface CollisionPoint {
  id: string;
  elementIds: string[];
  elements: ModelElement[];
  position: { x: number; y: number; width: number; height: number };
  collisionType: 'horizontal' | 'vertical' | 'both';
  conflictReason: string;
  minElevation: number;
  maxElevation: number;
  clearance: number;
}

function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getIntersectionRect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  return { x, y, width, height };
}

function elevationsOverlap(
  a: { bottomElevation: number; topElevation: number },
  b: { bottomElevation: number; topElevation: number }
): boolean {
  return (
    a.bottomElevation < b.topElevation &&
    a.topElevation > b.bottomElevation
  );
}

function getCollisionType(
  elem1: ModelElement,
  elem2: ModelElement
): 'horizontal' | 'vertical' | 'both' {
  const horizontalOverlap = rectsIntersect(elem1.position, elem2.position);
  const verticalOverlap = elevationsOverlap(elem1, elem2);

  if (horizontalOverlap && verticalOverlap) return 'both';
  if (horizontalOverlap) return 'horizontal';
  return 'vertical';
}

function generateConflictReason(elem1: ModelElement, elem2: ModelElement): string {
  const name1 = getDisciplineName(elem1.discipline);
  const name2 = getDisciplineName(elem2.discipline);
  const collisionType = getCollisionType(elem1, elem2);

  if (collisionType === 'both') {
    const overlapBottom = Math.max(elem1.bottomElevation, elem2.bottomElevation);
    const overlapTop = Math.min(elem1.topElevation, elem2.topElevation);
    const overlapHeight = (overlapTop - overlapBottom).toFixed(2);
    return `${name1}(${elem1.system})与${name2}(${elem2.system})在平面和标高上均发生冲突，标高重叠区域 ${overlapBottom}m-${overlapTop}m，重叠高度 ${overlapHeight}m`;
  } else if (collisionType === 'horizontal') {
    return `${name1}(${elem1.system})与${name2}(${elem2.system})在平面位置上交叉，虽标高不重叠但净空不足，建议调整`;
  } else {
    const overlapBottom = Math.max(elem1.bottomElevation, elem2.bottomElevation);
    const overlapTop = Math.min(elem1.topElevation, elem2.topElevation);
    return `${name1}(${elem1.system})与${name2}(${elem2.system})标高重叠，重叠区域 ${overlapBottom}m-${overlapTop}m，需调整避让`;
  }
}

export function detectCollisions(elements: ModelElement[]): CollisionPoint[] {
  const collisions: CollisionPoint[] = [];
  const checkedPairs = new Set<string>();

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const elem1 = elements[i];
      const elem2 = elements[j];

      const pairKey = [elem1.id, elem2.id].sort().join('-');
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);

      if (elem1.discipline === elem2.discipline) continue;

      const horizontalOverlap = rectsIntersect(elem1.position, elem2.position);
      const verticalOverlap = elevationsOverlap(elem1, elem2);

      if (!horizontalOverlap && !verticalOverlap) continue;
      if (!horizontalOverlap) continue;

      const collisionType = getCollisionType(elem1, elem2);
      const intersection = getIntersectionRect(elem1.position, elem2.position);
      const minElevation = Math.max(elem1.bottomElevation, elem2.bottomElevation);
      const maxElevation = Math.min(elem1.topElevation, elem2.topElevation);
      const clearance = minElevation - Math.min(elem1.bottomElevation, elem2.bottomElevation);

      const collision: CollisionPoint = {
        id: `collision-${Date.now()}-${i}-${j}`,
        elementIds: [elem1.id, elem2.id],
        elements: [elem1, elem2],
        position: {
          x: intersection.x - 5,
          y: intersection.y - 5,
          width: intersection.width + 10,
          height: intersection.height + 10,
        },
        collisionType,
        conflictReason: generateConflictReason(elem1, elem2),
        minElevation,
        maxElevation,
        clearance,
      };

      collisions.push(collision);
    }
  }

  return collisions.sort((a, b) => {
    if (a.collisionType === 'both' && b.collisionType !== 'both') return -1;
    if (b.collisionType === 'both' && a.collisionType !== 'both') return 1;
    if (a.collisionType === 'horizontal' && b.collisionType === 'vertical') return -1;
    if (b.collisionType === 'horizontal' && a.collisionType === 'vertical') return 1;
    return b.maxElevation - b.minElevation - (a.maxElevation - a.minElevation);
  });
}

export function getCollisionTypeLabel(type: 'horizontal' | 'vertical' | 'both'): string {
  switch (type) {
    case 'both':
      return '严重冲突';
    case 'horizontal':
      return '平面交叉';
    case 'vertical':
      return '标高重叠';
  }
}

export function getCollisionTypeColor(type: 'horizontal' | 'vertical' | 'both'): string {
  switch (type) {
    case 'both':
      return '#dc2626';
    case 'horizontal':
      return '#ea580c';
    case 'vertical':
      return '#d97706';
  }
}
