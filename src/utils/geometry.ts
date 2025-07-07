import { Point, GeoJSONGeometry } from "@/config/type";
// @ts-ignore
import Delaunator from "delaunator";

/**
 * 将GeoJSON坐标转换为Point格式
 */
export const coordinatesToPoints = (
  coordinates: number[][],
  defaultHeight: number = 0
): Point[] => {
  return coordinates.map(([lon, lat, height = defaultHeight]) => ({
    lon,
    lat,
    height,
  }));
};

/**
 * 解析GeoJSON几何体，统一转换为MultiPolygon格式
 */
export const parseGeoJSONGeometry = (
  geometry: GeoJSONGeometry,
  defaultHeight: number = 0
): { contours: Point[][]; holes: Point[][][] } => {
  let multiPolygonCoords: number[][][][];

  if (geometry.type === "Polygon") {
    multiPolygonCoords = [geometry.coordinates];
  } else if (geometry.type === "MultiPolygon") {
    multiPolygonCoords = geometry.coordinates;
  } else {
    throw new Error("GeoBuilding 只支持 Polygon 和 MultiPolygon 类型");
  }

  const contours: Point[][] = [];
  const holes: Point[][][] = [];

  multiPolygonCoords.forEach((polygonCoords) => {
    if (polygonCoords.length === 0) return;

    // 第一个环是外环（轮廓）
    const contour = coordinatesToPoints(polygonCoords[0], defaultHeight);
    contours.push(contour);

    // 其余的环是内环（洞）
    const polygonHoles: Point[][] = [];
    for (let i = 1; i < polygonCoords.length; i++) {
      const hole = coordinatesToPoints(polygonCoords[i], defaultHeight);
      polygonHoles.push(hole);
    }
    holes.push(polygonHoles);
  });

  return { contours, holes };
};

/**
 * 判断点是否在多边形内部
 */
export const isPointInPolygon = (
  testPoint: [number, number],
  polygon: [number, number][]
): boolean => {
  let inside = false;
  const x = testPoint[0];
  const y = testPoint[1];

  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    j = i;
  }

  return inside;
};

/**
 * 检查点是否在任何洞内
 */
export const isPointInAnyHole = (
  testPoint: [number, number],
  holes: [number, number][][]
): boolean => {
  for (const hole of holes) {
    if (isPointInPolygon(testPoint, hole)) {
      return true;
    }
  }
  return false;
};

/**
 * 检查顺时针方向
 */
export const isClockWise = (pts: [number, number][]): boolean => {
  let area = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return area < 0;
};

/**
 * 合并重叠点
 */
export const mergeOverlappingPoints = (points: [number, number][]): void => {
  const THRESHOLD = 1e-10;
  const THRESHOLD_SQ = THRESHOLD * THRESHOLD;
  let prevPos = points[0];

  for (let i = 1; i <= points.length; i++) {
    const currentIndex = i % points.length;
    const currentPos = points[currentIndex];
    const dx = currentPos[0] - prevPos[0];
    const dy = currentPos[1] - prevPos[1];
    const distSq = dx * dx + dy * dy;

    const scalingFactorSqrt = Math.max(
      Math.abs(currentPos[0]),
      Math.abs(currentPos[1]),
      Math.abs(prevPos[0]),
      Math.abs(prevPos[1])
    );
    const thresholdSqScaled = THRESHOLD_SQ * scalingFactorSqrt * scalingFactorSqrt;

    if (distSq <= thresholdSqScaled) {
      points.splice(currentIndex, 1);
      i--;
      continue;
    }

    prevPos = currentPos;
  }
};

/**
 * 根据细分程度对多边形边界进行细分
 */
export const subdividePolygonBoundary = (
  polygon: [number, number][],
  subdivisionFactor: number
): [number, number][] => {
  if (subdivisionFactor <= 1) {
    return [...polygon];
  }

  const subdividedPoints: [number, number][] = [];
  let totalPerimeter = 0;
  for (let i = 0; i < polygon.length; i++) {
    const currentPoint = polygon[i];
    const nextPoint = polygon[(i + 1) % polygon.length];
    const dx = nextPoint[0] - currentPoint[0];
    const dy = nextPoint[1] - currentPoint[1];
    totalPerimeter += Math.sqrt(dx * dx + dy * dy);
  }

  const targetSegmentLength = totalPerimeter / (subdivisionFactor * 50);

  for (let i = 0; i < polygon.length; i++) {
    const currentPoint = polygon[i];
    const nextPoint = polygon[(i + 1) % polygon.length];

    subdividedPoints.push(currentPoint);

    const dx = nextPoint[0] - currentPoint[0];
    const dy = nextPoint[1] - currentPoint[1];
    const edgeLength = Math.sqrt(dx * dx + dy * dy);

    const segmentCount = Math.max(1, Math.ceil(edgeLength / targetSegmentLength));

    for (let j = 1; j < segmentCount; j++) {
      const t = j / segmentCount;
      const interpolatedPoint: [number, number] = [
        currentPoint[0] + t * dx,
        currentPoint[1] + t * dy,
      ];
      subdividedPoints.push(interpolatedPoint);
    }
  }

  return subdividedPoints;
};

/**
 * 检查点是否在多边形边界上
 */
export const isPointOnPolygonBoundary = (
  point: [number, number],
  polygon: [number, number][],
  tolerance: number = 1e-10
): boolean => {
  const [x, y] = point;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[j];

    // 检查点是否在线段上
    const crossProduct = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1);
    if (Math.abs(crossProduct) < tolerance) {
      // 检查点是否在线段范围内
      const dotProduct = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
      const squaredLength = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);

      if (dotProduct >= 0 && dotProduct <= squaredLength) {
        return true;
      }
    }
  }
  return false;
};

/**
 * 检查两条线段是否相交
 */
export const lineSegmentsIntersect = (
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean => {
  const x1 = p1[0],
    y1 = p1[1];
  const x2 = p2[0],
    y2 = p2[1];
  const x3 = p3[0],
    y3 = p3[1];
  const x4 = p4[0],
    y4 = p4[1];

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return false; // 平行线

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

/**
 * 严格检查线段是否与多边形边界相交（排除端点重合的情况）
 */
export const lineIntersectsPolygonStrict = (
  p1: [number, number],
  p2: [number, number],
  polygon: [number, number][]
): boolean => {
  const tolerance = 1e-10;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const a = polygon[i];
    const b = polygon[j];

    // 检查端点是否重合
    const p1EqualsA = Math.abs(p1[0] - a[0]) < tolerance && Math.abs(p1[1] - a[1]) < tolerance;
    const p1EqualsB = Math.abs(p1[0] - b[0]) < tolerance && Math.abs(p1[1] - b[1]) < tolerance;
    const p2EqualsA = Math.abs(p2[0] - a[0]) < tolerance && Math.abs(p2[1] - a[1]) < tolerance;
    const p2EqualsB = Math.abs(p2[0] - b[0]) < tolerance && Math.abs(p2[1] - b[1]) < tolerance;

    // 如果端点重合，跳过这个检查
    if (p1EqualsA || p1EqualsB || p2EqualsA || p2EqualsB) {
      continue;
    }

    if (lineSegmentsIntersect(p1, p2, a, b)) {
      return true;
    }
  }
  return false;
};

/**
 * 检查三角形是否有效
 */
export const isValidTriangle = (
  v1: [number, number],
  v2: [number, number],
  v3: [number, number],
  contour: [number, number][],
  holes: [number, number][][]
): boolean => {
  const centroid: [number, number] = [(v1[0] + v2[0] + v3[0]) / 3, (v1[1] + v2[1] + v3[1]) / 3];

  if (!isPointInPolygon(centroid, contour) || isPointInAnyHole(centroid, holes)) {
    return false;
  }

  // 检查三角形的边是否与洞的边界相交
  const triangleEdges: [[number, number], [number, number]][] = [
    [v1, v2],
    [v2, v3],
    [v3, v1],
  ];

  for (const hole of holes) {
    for (const edge of triangleEdges) {
      // 检查边是否与洞边界相交，但排除端点在洞边界上的情况
      if (lineIntersectsPolygonStrict(edge[0], edge[1], hole)) {
        return false;
      }
    }
  }

  // 检查三角形的顶点是否都在有效区域内
  const vertices = [v1, v2, v3];
  for (const vertex of vertices) {
    if (!isPointInPolygon(vertex, contour) || isPointInAnyHole(vertex, holes)) {
      // 如果顶点在洞的边界上，则允许
      let onHoleBoundary = false;
      for (const hole of holes) {
        if (isPointOnPolygonBoundary(vertex, hole)) {
          onHoleBoundary = true;
          break;
        }
      }
      // 如果顶点在主多边形边界上，也允许
      if (!onHoleBoundary && !isPointOnPolygonBoundary(vertex, contour)) {
        return false;
      }
    }
  }

  // 额外检查：确保三角形不完全位于洞内
  const allVerticesInHole = holes.some((hole) =>
    vertices.every((vertex) => isPointInPolygon(vertex, hole))
  );
  if (allVerticesInHole) {
    return false;
  }

  return true;
};

/**
 * 使用Delaunator进行三角剖分
 */
export const triangulateWithDelaunator = (
  contour: [number, number][],
  holes: [number, number][][],
  interiorPoints: [number, number][]
): [number, number][] => {
  const vertices = [...contour];

  for (const hole of holes) {
    vertices.push(...hole);
  }

  vertices.push(...interiorPoints);

  const delaunay = Delaunator.from(vertices);
  const triangles = delaunay.triangles;

  const triangleVertices: [number, number][] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const v1 = vertices[triangles[i]];
    const v2 = vertices[triangles[i + 1]];
    const v3 = vertices[triangles[i + 2]];

    if (isValidTriangle(v1, v2, v3, contour, holes)) {
      triangleVertices.push(v1, v2, v3);
    }
  }

  return triangleVertices;
};

/**
 * 生成内部网格点
 */
export const generateInteriorPoints = (
  boundaryPoints: [number, number][],
  holePoints: [number, number][][],
  subdivisionFactor: number
): [number, number][] => {
  const interiorPoints: [number, number][] = [];

  if (subdivisionFactor <= 1) {
    return interiorPoints;
  }

  const xlist = boundaryPoints.map((p) => p[0]);
  const ylist = boundaryPoints.map((p) => p[1]);

  const minLon = Math.min.apply(null, xlist);
  const maxLon = Math.max.apply(null, xlist);
  const minLat = Math.min.apply(null, ylist);
  const maxLat = Math.max.apply(null, ylist);

  const gridWidth = maxLon - minLon;
  const gridHeight = maxLat - minLat;

  const stepLon = gridWidth / (subdivisionFactor * 10);
  const stepLat = gridHeight / (subdivisionFactor * 10);

  for (let lon = minLon + stepLon; lon < maxLon; lon += stepLon) {
    for (let lat = minLat + stepLat; lat < maxLat; lat += stepLat) {
      const testPoint: [number, number] = [lon, lat];
      if (isPointInPolygon(testPoint, boundaryPoints) && !isPointInAnyHole(testPoint, holePoints)) {
        interiorPoints.push(testPoint);
      }
    }
  }

  return interiorPoints;
};
