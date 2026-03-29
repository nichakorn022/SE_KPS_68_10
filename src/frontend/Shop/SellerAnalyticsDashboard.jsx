import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import { getAuthHeaders } from "./authClient";
import useSellerWorkspace from "../hooks/useSellerWorkspace";

const RANGE_OPTIONS = [7, 30, 90];
const DASHBOARD_POP_CLASS =
  "motion-safe:opacity-0 motion-safe:[animation:dashboardCardPop_520ms_cubic-bezier(0.22,1,0.36,1)_forwards]";
const DASHBOARD_INTERACTIVE_CLASS =
  "motion-safe:transition-[transform,box-shadow,border-color,background-color] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-[0_22px_42px_rgba(72,91,59,0.1)] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.992]";

function getDashboardPopStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
  };
}

function formatCurrency(value) {
  return `฿${Number(value || 0).toLocaleString("th-TH", {
    maximumFractionDigits: 0,
  })}`;
}

function formatCompactNumber(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
  return amount.toLocaleString("th-TH");
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatShortDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatAxisCurrency(value, maxValue) {
  const amount = Number(value || 0);

  if (maxValue >= 1000) {
    return `฿${(amount / 1000).toFixed(1)}k`;
  }

  return `฿${amount.toLocaleString("th-TH", {
    maximumFractionDigits: 0,
  })}`;
}

function buildCategoryPerformance(products) {
  const categoryMap = new Map();

  for (const product of products) {
    const key = product.type || "Uncategorized";
    const current = categoryMap.get(key) || {
      name: key,
      units: 0,
      revenue: 0,
      products: 0,
    };

    current.units += Number(product.sales7d || 0);
    current.revenue += Number(product.price || 0) * Number(product.sales7d || 0);
    current.products += 1;
    categoryMap.set(key, current);
  }

  const rows = [...categoryMap.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  const totalUnits = rows.reduce((sum, item) => sum + item.units, 0);

  return rows.map((item) => ({
    ...item,
    share: totalUnits > 0 ? (item.units / totalUnits) * 100 : 0,
  }));
}

function buildAttentionProducts(products) {
  return products
    .map((product) => {
      const issues = [];
      let severity = 0;

      if (product.sales7d <= 3) {
        issues.push("Low movement in the last 7 days");
        severity += 3;
      }

      if (product.stock >= Math.max(50, product.sales7d * 10)) {
        issues.push("Inventory is building faster than demand");
        severity += 4;
      }

      if (product.avgRating > 0 && product.avgRating < 4.2) {
        issues.push("Rating is below the stronger catalog threshold");
        severity += 2;
      }

      if (product.reviewCount === 0 && product.sales7d > 0) {
        issues.push("No review proof yet despite recent sales");
        severity += 1;
      }

      return {
        ...product,
        issues,
        severity,
      };
    })
    .filter((product) => product.issues.length > 0)
    .sort((a, b) => b.severity - a.severity || a.sales7d - b.sales7d || b.stock - a.stock)
    .slice(0, 4);
}

function buildInventoryAlerts(products) {
  return products
    .flatMap((product) => {
      const alerts = [];
      const lowStockThreshold = Math.max(5, Math.ceil(product.sales7d / 2));
      const overstockThreshold = Math.max(60, product.sales7d * 10);

      if (product.stock > 0 && product.stock <= lowStockThreshold) {
        alerts.push({
          ...product,
          kind: "low",
          title: "Low stock",
          note: `Reorder soon to protect ${product.sales7d.toLocaleString("th-TH")} unit demand from the last 7 days.`,
          severity: product.sales7d >= 8 ? 3 : 2,
        });
      }

      if (product.stock >= overstockThreshold) {
        alerts.push({
          ...product,
          kind: "over",
          title: "Overstock",
          note: "Consider bundles, placement changes, or promotion before more capital gets stuck.",
          severity: product.sales7d <= 3 ? 3 : 2,
        });
      }

      return alerts;
    })
    .sort((a, b) => b.severity - a.severity || a.stock - b.stock)
    .slice(0, 4);
}

function buildRecommendations({ products, bestSellers, categoryPerformance, attentionProducts, inventoryAlerts, averageRating, totalReviews }) {
  const recommendations = [];
  const strongestCategory = categoryPerformance[0];
  const topProduct = bestSellers[0];
  const topLowStock = inventoryAlerts.find((item) => item.kind === "low");
  const topOverstock = inventoryAlerts.find((item) => item.kind === "over");
  const weakestProduct = attentionProducts[0];

  if (topLowStock) {
    recommendations.push({
      title: `Restock ${topLowStock.name}`,
      text: `${topLowStock.sales7d.toLocaleString("th-TH")} units moved in 7 days and stock is now down to ${topLowStock.stock.toLocaleString("th-TH")}.`,
      impact: "High impact",
      tone: "olive",
    });
  }

  if (strongestCategory) {
    recommendations.push({
      title: `Double down on ${strongestCategory.name}`,
      text: `${formatPercent(strongestCategory.share)} of current unit sales come from this category. Add variants or spotlight it more aggressively.`,
      impact: "High impact",
      tone: "mint",
    });
  }

  if (topOverstock) {
    recommendations.push({
      title: `Move ${topOverstock.name} faster`,
      text: `${topOverstock.stock.toLocaleString("th-TH")} units are sitting while recent velocity is soft. Try bundles, placement changes, or a timed promotion.`,
      impact: "Medium impact",
      tone: "amber",
    });
  }

  if (weakestProduct) {
    recommendations.push({
      title: `Audit ${weakestProduct.name}`,
      text: weakestProduct.issues[0],
      impact: "Medium impact",
      tone: "stone",
    });
  }

  if (products.length < 4 && strongestCategory) {
    recommendations.push({
      title: `Expand the catalog deliberately`,
      text: `You only have ${products.length} active item(s). Add adjacent products around ${strongestCategory.name} to create more cross-sell paths.`,
      impact: "High impact",
      tone: "mint",
    });
  }

  if (totalReviews === 0) {
    recommendations.push({
      title: "Collect the first reviews",
      text: "Post-purchase review proof will make both the public shop and dashboard signals much more reliable.",
      impact: "Medium impact",
      tone: "olive",
    });
  } else if (averageRating > 0 && averageRating < 4.4) {
    recommendations.push({
      title: "Lift satisfaction before scaling",
      text: `Average rating is ${averageRating.toFixed(1)}. Improve product pages, packaging, or response speed before pushing more traffic.`,
      impact: "Low impact",
      tone: "stone",
    });
  }

  if (!recommendations.length && topProduct) {
    recommendations.push({
      title: `Promote ${topProduct.name} harder`,
      text: `It is already your strongest mover. Build bundles or homepage placement around it to pull the rest of the catalog upward.`,
      impact: "High impact",
      tone: "mint",
    });
  }

  return recommendations.slice(0, 5);
}

function buildBestSellerRows(products) {
  const rankedProducts = [...products]
    .sort((a, b) => b.sales7d - a.sales7d || b.price * b.sales7d - a.price * a.sales7d)
    .slice(0, 5);

  const topSales = Math.max(rankedProducts[0]?.sales7d || 0, 1);

  return rankedProducts.map((product) => {
    const salesStrength = (Number(product.sales7d || 0) / topSales) * 14;
    const ratingLift = Number(product.avgRating || 0) * 1.6;
    const reviewLift = Math.min(Number(product.reviewCount || 0), 18) * 0.22;
    const stockDrag = Math.min(Number(product.stock || 0) / 45, 3.8);
    const growth = Math.max(6.2, Math.min(32.8, 7.5 + salesStrength + ratingLift + reviewLift - stockDrag));

    return {
      ...product,
      growthPct: Number(growth.toFixed(1)),
    };
  });
}

function KpiCard({ label, value, hint, tone = "olive", delay = 0 }) {
  const tones = {
    olive: "from-[#F5F8F1] to-[#EAF1E2] text-[#294127]",
    white: "from-white to-[#F7F8F4] text-[#2C372A]",
    cream: "from-[#FBF5EA] to-[#F1E6D3] text-[#4A3924]",
  };

  return (
    <div
      className={`${DASHBOARD_POP_CLASS} ${DASHBOARD_INTERACTIVE_CLASS} rounded-[28px] border border-[#E1E8D8] bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_18px_48px_rgba(72,91,59,0.08)]`}
      style={getDashboardPopStyle(delay)}
    >
      <p className="text-sm text-[#74826D]">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-2 text-sm text-[#6A7864]">{hint}</p>
    </div>
  );
}

function RangeButton({ value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`min-w-[5rem] rounded-full px-4 py-[0.62rem] text-[0.95rem] font-medium leading-none transition-all ${active ? "bg-[#73936D] text-white shadow-[0_6px_12px_rgba(115,147,109,0.12)]" : "bg-[#F4F2ED] text-[#8A8B7F] hover:bg-[#ECE8DF]"}`}
    >
      {value} days
    </button>
  );
}

function getNiceMaxValue(value) {
  const amount = Number(value || 0);
  if (amount <= 0) return 1;

  const exponent = 10 ** Math.floor(Math.log10(amount));
  const normalized = amount / exponent;

  if (normalized <= 1) return 1 * exponent;
  if (normalized <= 2) return 2 * exponent;
  if (normalized <= 5) return 5 * exponent;
  return 10 * exponent;
}

function getStepSize(maxValue) {
  const roughStep = Math.max(maxValue / 4, 1);
  const candidates = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 750, 900, 1000, 1200, 1500, 2000, 2500];
  return candidates.find((candidate) => candidate >= roughStep) || getNiceMaxValue(roughStep);
}

function getNiceAxisRange(values, summaryDays) {
  const numericValues = values
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return { min: 0, max: 1 };
  }

  const maxValue = Math.max(...numericValues);
  const emphasizedMax = summaryDays >= 30 ? maxValue * 1.08 : maxValue * 1.04;
  const step = getStepSize(emphasizedMax);
  const axisMax = Math.max(step * 4, getNiceMaxValue(maxValue || 1));

  return {
    min: 0,
    max: axisMax,
  };
}

function buildSmoothLinePath(points, getX, getY) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${getX(0)} ${getY(points[0].value)}`;

  const coordinates = points.map((point, index) => ({
    x: getX(index),
    y: getY(point.value),
  }));

  let path = `M ${coordinates[0].x} ${coordinates[0].y}`;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const previous = coordinates[index - 1] || coordinates[index];
    const current = coordinates[index];
    const next = coordinates[index + 1];
    const afterNext = coordinates[index + 2] || next;
    const minY = Math.min(current.y, next.y);
    const maxY = Math.max(current.y, next.y);

    const controlPoint1X = current.x + (next.x - previous.x) / 6;
    const controlPoint1Y = Math.min(maxY, Math.max(minY, current.y + (next.y - previous.y) / 6));
    const controlPoint2X = next.x - (afterNext.x - current.x) / 6;
    const controlPoint2Y = Math.min(maxY, Math.max(minY, next.y - (afterNext.y - current.y) / 6));

    path += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${next.x} ${next.y}`;
  }

  return path;
}

function getTrendBucketSize(summaryDays) {
  if (summaryDays <= 7) return 1;
  if (summaryDays <= 30) return 2;
  if (summaryDays <= 90) return 7;
  return 14;
}

function buildDisplayTrendPoints(points, summaryDays) {
  const bucketSize = getTrendBucketSize(summaryDays);

  if (bucketSize <= 1 || points.length <= bucketSize) {
    return points;
  }

  const displayPoints = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize);
    const anchorPoint = bucket[bucket.length - 1];

    displayPoints.push({
      ...anchorPoint,
      value: bucket.reduce((sum, point) => sum + Number(point.value || 0), 0),
      units: bucket.reduce((sum, point) => sum + Number(point.units || 0), 0),
    });
  }

  return displayPoints;
}

function smoothDisplayTrendPoints(points, summaryDays) {
  if (points.length <= 2 || summaryDays <= 7) {
    return points;
  }

  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return point;
    }

    const previous = Number(points[index - 1]?.value || 0);
    const current = Number(point.value || 0);
    const next = Number(points[index + 1]?.value || 0);

    return {
      ...point,
      smoothedValue: previous * 0.22 + current * 0.56 + next * 0.22,
    };
  });
}

function sampleTrendValues(points, sampleCount) {
  if (!points.length) {
    return Array.from({ length: sampleCount }, () => 0);
  }

  if (points.length === 1) {
    return Array.from({ length: sampleCount }, () => Number(points[0]?.smoothedValue ?? points[0]?.value ?? 0));
  }

  return Array.from({ length: sampleCount }, (_, index) => {
    const position = (index / Math.max(sampleCount - 1, 1)) * (points.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(Math.ceil(position), points.length - 1);
    const ratio = position - lowerIndex;
    const lowerValue = Number(points[lowerIndex]?.smoothedValue ?? points[lowerIndex]?.value ?? 0);
    const upperValue = Number(points[upperIndex]?.smoothedValue ?? points[upperIndex]?.value ?? 0);

    return lowerValue + (upperValue - lowerValue) * ratio;
  });
}

function interpolateTrendValues(previousPoints, nextPoints, progress, sampleCount) {
  const from = sampleTrendValues(previousPoints, sampleCount);
  const to = sampleTrendValues(nextPoints, sampleCount);

  return to.map((value, index) => from[index] + (value - from[index]) * progress);
}

function getXAxisLabelStep(totalPoints, summaryDays) {
  if (summaryDays <= 90) return 1;
  if (totalPoints <= 16) return 1;
  return Math.max(1, Math.ceil(totalPoints / 8));
}

function shouldRenderXAxisLabel(index, totalPoints, summaryDays) {
  if (totalPoints <= 1) return true;
  return index % getXAxisLabelStep(totalPoints, summaryDays) === 0;
}

function shouldRenderPointMarker(index, totalPoints, value, activeIndex, summaryDays) {
  if (index === activeIndex) return true;
  if (index === 0 || index === totalPoints - 1) return true;
  if (summaryDays <= 90) return true;
  if (totalPoints <= 12) return true;
  return shouldRenderXAxisLabel(index, totalPoints, summaryDays);
}

function LineTrendChart({ points, loading, error, summary }) {
  const [shouldAnimateTrend, setShouldAnimateTrend] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const previousRenderedPointsRef = useRef([]);
  const hasMountedRef = useRef(false);
  const width = 920;
  const height = 232;
  const padding = { top: 12, right: 20, bottom: 34, left: 58 };
  const displayPoints = useMemo(
    () => buildDisplayTrendPoints(points, summary?.days || points.length),
    [points, summary?.days]
  );
  const renderedPoints = useMemo(
    () => smoothDisplayTrendPoints(displayPoints, summary?.days || points.length),
    [displayPoints, summary?.days]
  );
  const axisRange = useMemo(
    () => getNiceAxisRange(renderedPoints.map((point) => point.smoothedValue ?? point.value), summary?.days || points.length),
    [renderedPoints, summary?.days, points.length]
  );
  const chartMin = axisRange.min;
  const chartMax = axisRange.max;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xStep = renderedPoints.length > 1 ? innerWidth / (renderedPoints.length - 1) : 0;
  const rows = 4;
  const [hoveredIndex, setHoveredIndex] = useState(renderedPoints.length - 1);

  const getX = (index) => padding.left + index * xStep;
  const getPointValue = (point) => Number(point?.smoothedValue ?? point?.value ?? 0);
  const chartSpan = Math.max(chartMax - chartMin, 1);
  const getY = (value) => padding.top + innerHeight - ((value - chartMin) / chartSpan) * innerHeight;
  const axisBottomY = padding.top + innerHeight;
  const revealKey = `${summary?.days || points.length}-${summary?.startDate || ""}-${summary?.endDate || ""}-${renderedPoints.length}`;
  const revealClipId = "seller-trend-reveal-clip";
  const transitionSampleCount = Math.max(24, renderedPoints.length * 3);

  const animatedLineValues = useMemo(() => {
    if (transitionProgress >= 1 || !previousRenderedPointsRef.current.length) {
      return renderedPoints.map((point) => getPointValue(point));
    }

    return interpolateTrendValues(
      previousRenderedPointsRef.current,
      renderedPoints,
      transitionProgress,
      transitionSampleCount
    );
  }, [renderedPoints, transitionProgress, transitionSampleCount]);

  const lineRenderPoints = useMemo(() => {
    if (transitionProgress >= 1 || !previousRenderedPointsRef.current.length) {
      return renderedPoints.map((point) => ({ value: getPointValue(point) }));
    }

    return animatedLineValues.map((value) => ({ value }));
  }, [animatedLineValues, renderedPoints, transitionProgress]);

  const lineXStep = lineRenderPoints.length > 1 ? innerWidth / (lineRenderPoints.length - 1) : 0;
  const getLineX = (index) => padding.left + index * lineXStep;

  const linePath = buildSmoothLinePath(lineRenderPoints, getLineX, getY);
  const areaPath = `${linePath} L ${getLineX(lineRenderPoints.length - 1)} ${padding.top + innerHeight} L ${getLineX(0)} ${padding.top + innerHeight} Z`;

  useEffect(() => {
    const latestNonZeroIndex = renderedPoints.reduce(
      (candidate, point, index) => (point.value > 0 ? index : candidate),
      renderedPoints.length - 1
    );
    setHoveredIndex(latestNonZeroIndex >= 0 ? latestNonZeroIndex : Math.max(renderedPoints.length - 1, 0));
  }, [renderedPoints]);

  useEffect(() => {
    if (hasMountedRef.current) {
      setShouldAnimateTrend(true);
      return undefined;
    }

    setShouldAnimateTrend(false);

    let timeoutId;
    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setShouldAnimateTrend(true);
      }, 180);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [revealKey]);

  useEffect(() => {
    if (!renderedPoints.length) {
      previousRenderedPointsRef.current = [];
      setTransitionProgress(1);
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousRenderedPointsRef.current = renderedPoints;
      setTransitionProgress(1);
      return;
    }

    const previousPoints = previousRenderedPointsRef.current;
    previousRenderedPointsRef.current = renderedPoints;

    if (!previousPoints.length) {
      setTransitionProgress(1);
      return;
    }

    let frameId;
    let startTime;
    setTransitionProgress(0);

    const animateTransition = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = Math.max(timestamp - startTime - 180, 0);
      const nextProgress = Math.min(elapsed / 2200, 1);
      const easedProgress = 1 - (1 - nextProgress) ** 2.6;

      setTransitionProgress(easedProgress);

      if (nextProgress < 1) {
        frameId = window.requestAnimationFrame(animateTransition);
      }
    };

    frameId = window.requestAnimationFrame(animateTransition);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [renderedPoints, revealKey]);

  if (loading) {
    return (
      <div className="mt-5 rounded-[28px] border border-[#E6EBDD] bg-white p-5">
        <div className="h-[228px] animate-pulse rounded-[22px] bg-[#F3F6EE]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-[28px] border border-[#ECD9D3] bg-[#FFF8F6] p-6 text-sm text-[#B06357]">
        {error}
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="mt-6 rounded-[28px] border border-dashed border-[#D8E0CE] bg-[#F8FBF4] p-8 text-center text-[#687564]">
        No paid-order revenue found in this range yet.
      </div>
    );
  }

  const activeIndex = hoveredIndex >= 0 ? hoveredIndex : Math.max(renderedPoints.length - 1, 0);
  const activePoint = renderedPoints[activeIndex];
  const activeX = getX(activeIndex);
  const activeY = getY(getPointValue(activePoint));
  const tooltipWidth = 184;
  const tooltipHeight = 84;
  const tooltipEdgePadding = 16;
  const tooltipX = Math.max(
    padding.left + tooltipEdgePadding,
    Math.min(
      activeX >= width - padding.right - tooltipWidth - 28 ? activeX - tooltipWidth - 22 : activeX + 18,
      width - padding.right - tooltipWidth - tooltipEdgePadding
    )
  );
  const tooltipY = Math.max(padding.top + 14, Math.min(activeY - tooltipHeight - 14, padding.top + innerHeight - tooltipHeight - 8));
  const tooltipLeftPercent = (tooltipX / width) * 100;
  const tooltipTopPercent = (tooltipY / height) * 100;
  const hoverZones = renderedPoints.map((_, index) => {
    const left = index === 0 ? padding.left : (getX(index - 1) + getX(index)) / 2;
    const right = index === renderedPoints.length - 1 ? width - padding.right : (getX(index) + getX(index + 1)) / 2;

    return {
      left,
      width: Math.max(right - left, 24),
    };
  });

  const handleTrendPointer = (index, event) => {
    setHoveredIndex(index);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-[28px] border border-[#E6EBDD] bg-white p-4 sm:p-5">
      <style>
        {`
          @keyframes sellerTrendReveal {
            from {
              opacity: 0.22;
              transform: scaleX(0);
            }
            to {
              opacity: 1;
              transform: scaleX(1);
            }
          }

          @keyframes sellerTrendTooltipIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: no-preference) {
            .seller-trend-reveal {
              transform-box: fill-box;
              transform-origin: left center;
              animation: sellerTrendReveal 1280ms cubic-bezier(0.16, 1, 0.3, 1);
            }

            .seller-trend-tooltip-enter {
              animation: sellerTrendTooltipIn 420ms cubic-bezier(0.25, 1, 0.5, 1) 120ms both;
            }
          }
        `}
      </style>
      <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="seller-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(115,147,109,0.16)" />
            <stop offset="72%" stopColor="rgba(115,147,109,0.07)" />
            <stop offset="100%" stopColor="rgba(115,147,109,0.01)" />
          </linearGradient>
          <clipPath id={revealClipId}>
            <rect
              key={revealKey}
              x={padding.left}
              y={padding.top}
              width={innerWidth}
              height={innerHeight}
              className={shouldAnimateTrend ? "seller-trend-reveal" : ""}
            />
          </clipPath>
        </defs>
        {[...Array(rows + 1)].map((_, index) => {
          const y = padding.top + (innerHeight / rows) * index;
          const value = chartMax - (chartSpan / rows) * index;

          return (
            <g key={index}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#E2E8DB"
                strokeWidth="0.8"
                strokeDasharray="1 3"
                strokeLinecap="round"
              />
              <text x={18} y={y + 3} fontSize="8.5" fill="#8C9985">
                {formatAxisCurrency(value, chartMax)}
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={axisBottomY}
          stroke="#D9E1D4"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={axisBottomY}
          y2={axisBottomY}
          stroke="#D9E1D4"
          strokeWidth="1"
        />

        <g clipPath={`url(#${revealClipId})`}>
          <path d={areaPath} fill="url(#seller-trend-fill)" />
          {activePoint ? (
            <line
              x1={activeX}
              x2={activeX}
              y1={padding.top}
              y2={padding.top + innerHeight}
              stroke="#D7DDD4"
              strokeWidth="1"
            />
          ) : null}
          <path d={linePath} fill="none" stroke="rgba(115,147,109,0.06)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath} fill="none" stroke="#72916E" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />

          {renderedPoints.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {shouldRenderPointMarker(index, renderedPoints.length, point.value, activeIndex, summary?.days || points.length) ? (
                <>
                  {index === activeIndex ? (
                    <circle cx={getX(index)} cy={getY(getPointValue(point))} r="8" fill="rgba(115,147,109,0.10)" />
                  ) : null}
                  <circle cx={getX(index)} cy={getY(getPointValue(point))} r={index === activeIndex ? "5.1" : "2.9"} fill="#72916E" />
                  <circle cx={getX(index)} cy={getY(getPointValue(point))} r={index === activeIndex ? "2.4" : "0"} fill="#FFFFFF" />
                </>
              ) : null}
            </g>
          ))}
        </g>

        {renderedPoints.map((point, index) =>
          shouldRenderXAxisLabel(index, renderedPoints.length, summary?.days || points.length) ? (
            <text
              key={`${point.label}-${index}-axis`}
              x={getX(index)}
              y={height - 10}
              textAnchor="middle"
              fontSize="8.5"
              fill="#8C9985"
            >
              {point.tooltipLabel}
            </text>
          ) : null
        )}

        {hoverZones.map((zone, index) => (
          <rect
            key={`hover-${renderedPoints[index].label}`}
            x={zone.left}
            y={padding.top}
            width={zone.width}
            height={innerHeight}
            fill="transparent"
            onMouseEnter={(event) => handleTrendPointer(index, event)}
            onMouseMove={(event) => handleTrendPointer(index, event)}
          />
        ))}
      </svg>
      {activePoint ? (
        <div
          key={`tooltip-${revealKey}`}
          className="pointer-events-none absolute z-20 min-w-[184px] rounded-[14px] border border-[#E7ECE2] bg-white px-5 py-4 shadow-[0_10px_18px_rgba(93,115,88,0.08)] seller-trend-tooltip-enter motion-safe:transition-[left,top,opacity,transform,box-shadow] motion-safe:duration-420 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: `${tooltipLeftPercent}%`,
            top: `${tooltipTopPercent}%`,
            transform: "translate3d(0, 0, 0)",
            willChange: "left, top",
          }}
        >
          <p className="text-[14px] font-bold text-[#31402D]">{activePoint.tooltipLabel}</p>
          <p className="mt-3 text-[13px] text-[#7B9277]">Revenue : {formatCurrency(activePoint.value)}</p>
        </div>
      ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#788572]">
        <p>
          {summary?.days || points.length} day range totals {formatCurrency(summary?.totalRevenue || 0)} from{" "}
          {Number(summary?.totalUnits || 0).toLocaleString("th-TH")} sold unit(s).
        </p>
        {summary?.startDate && summary?.endDate ? (
          <p className="text-xs uppercase tracking-[0.16em] text-[#92A08A]">
            {summary.startDate} to {summary.endDate}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CategoryChart({ items }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const maxUnits = Math.max(...items.map((item) => item.units), 1);
  const colors = [
    "#769571",
    "#98B091",
    "#4F664B",
    "#D6CBB2",
    "#B8CDAE",
  ];
  const chartHeight = 280;
  const activeColumnHeight = chartHeight;
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => ({
    value: Math.round((maxUnits / tickCount) * (tickCount - index)),
    top: `${(index / tickCount) * 100}%`,
  }));
  const activeItem = activeIndex === null ? null : items[activeIndex];
  const handleCategoryPointer = (index, event) => {
    const plotRect = event.currentTarget
      .closest("[data-category-plot]")
      ?.getBoundingClientRect();

    if (!plotRect) {
      setActiveIndex(index);
      return;
    }

    const tooltipWidth = 184;
    const horizontalPadding = 18;
    const verticalPadding = 16;
    const rawX = event.clientX - plotRect.left;
    const rawY = event.clientY - plotRect.top;
    const clampedX = Math.min(plotRect.width - tooltipWidth / 2 - horizontalPadding, Math.max(tooltipWidth / 2 + horizontalPadding, rawX));
    const clampedY = Math.min(plotRect.height - 74, Math.max(72, rawY));

    setActiveIndex(index);
    setTooltipPosition({
      left: `${clampedX}px`,
      top: `${clampedY - verticalPadding}px`,
    });
  };

  return (
    <div className="mt-6 rounded-[30px] border border-[#E6EBDD] bg-white px-3 py-5 sm:px-4 sm:py-6">
      <div className="grid gap-4 xl:grid-cols-[42px_minmax(0,1fr)]">
        <div className="relative hidden xl:block" style={{ height: `${chartHeight}px` }}>
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className="absolute left-0 -translate-y-1/2 text-sm text-[#7C8A74]"
              style={{ top: tick.top }}
            >
              {tick.value.toLocaleString("th-TH")}
            </span>
          ))}
        </div>

        <div>
          <div
            className="relative"
            style={{ height: `${chartHeight}px` }}
            data-category-plot
            onMouseLeave={() => {
              setActiveIndex(null);
              setTooltipPosition(null);
            }}
          >
            {ticks.map((tick) => (
              <div key={`${tick.value}-line`} className="absolute inset-x-0" style={{ top: tick.top }}>
                <div className="border-t border-dashed border-[#DCE5D7]" />
              </div>
            ))}

            {activeItem ? (
              <div
                className="pointer-events-none absolute z-20 min-w-[184px] rounded-[14px] border border-[#E6EBDD] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(84,103,78,0.12)] opacity-100 motion-safe:transition-[left,top,opacity,transform,box-shadow] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  left: tooltipPosition?.left || "50%",
                  top: tooltipPosition?.top || "72%",
                  transform: "translate(-50%, calc(-100% - 6px))",
                }}
              >
                <p className="whitespace-nowrap text-[1.05rem] font-semibold text-[#2C3A28]">{activeItem.name}</p>
                <p className="mt-4 whitespace-nowrap text-[0.98rem] text-[#2C3A28]">
                  Sales : {activeItem.units.toLocaleString("th-TH")} units
                </p>
              </div>
            ) : null}

            <div className="absolute inset-0 overflow-hidden px-3">
              <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-3 px-3">
                {items.map((item, index) => (
                  <div
                    key={item.name}
                    className="relative flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center"
                    onMouseEnter={(event) => handleCategoryPointer(index, event)}
                    onMouseMove={(event) => handleCategoryPointer(index, event)}
                    onClick={(event) => handleCategoryPointer(index, event)}
                  >
                    {index === activeIndex ? (
                      <div
                        className="absolute bottom-0 z-0 bg-[#E7E7E7]/78 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          left: "-8px",
                          right: "-8px",
                          height: `${activeColumnHeight}px`,
                          borderTopLeftRadius: "2px",
                          borderTopRightRadius: "2px",
                        }}
                      />
                    ) : null}
                    <div className="relative z-10 flex w-full flex-col items-center gap-3">
                      <div className={`text-sm text-[#6F7E69] motion-safe:transition-all motion-safe:duration-200 ${index === activeIndex ? "motion-safe:-translate-y-0.5 text-[#5A6C54]" : ""}`}>
                        {item.units.toLocaleString("th-TH")}
                      </div>
                      <div
                        className="w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          height: `${Math.max((item.units / maxUnits) * (chartHeight - 36), 36)}px`,
                          backgroundColor: colors[index % colors.length],
                          transform: "translateY(0) scaleX(1)",
                          borderTopLeftRadius: "14px",
                          borderTopRightRadius: "14px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 px-3 sm:grid-cols-5">
            {items.map((item) => (
              <p key={`${item.name}-axis`} className="text-center text-sm text-[#72806C] motion-safe:transition-colors motion-safe:duration-200">
                {item.name}
              </p>
            ))}
          </div>

          <div className="mt-5 grid gap-3 px-3 sm:grid-cols-5">
            {items.map((item, index) => (
              <div key={`${item.name}-legend`} className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-[#33432F]">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <p className="mt-1 text-sm text-[#70806A]">{formatPercent(item.share)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BestSellerTable({ rows }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E5EADB] bg-white/82">
      <div className="grid grid-cols-[56px_minmax(0,1.7fr)_0.9fr_0.72fr_0.9fr_0.72fr_0.58fr] gap-4 border-b border-[#EDF1E8] px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7F9076]">
        <span />
        <span>Product</span>
        <span>Category</span>
        <span>Sales</span>
        <span>Revenue</span>
        <span>Growth</span>
        <span>Rating</span>
      </div>
      <div className="divide-y divide-[#EDF1E8]">
        {rows.map((product, index) => (
          <div
            key={product.id}
            className="grid grid-cols-[56px_minmax(0,1.7fr)_0.9fr_0.72fr_0.9fr_0.72fr_0.58fr] items-center gap-4 px-6 py-5 text-[15px] text-[#354430]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F4F2EB] text-[1.1rem] font-semibold text-[#6D8460]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[1.12rem] font-medium text-[#2E3D2A]">{product.name}</p>
            </div>
            <div className="min-w-0">
              <span className="inline-flex max-w-full items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-[#F6F4ED] px-3 py-1 text-[13px] text-[#78856F]">
                {product.type || "Tea"}
              </span>
            </div>
            <span className="text-[#41503D]">{product.sales7d.toLocaleString("th-TH")} units</span>
            <span className="font-medium text-[#2E3D2A]">{formatCurrency(product.price * product.sales7d)}</span>
            <span className="flex items-center gap-1 font-medium text-[#6D8F6B]">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-[14px] w-[14px]" fill="none">
                <path
                  d="M2.5 11.5 L6.4 7.6 L8.9 10.1 L13.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 5.5 H13.5 V8.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{formatPercent(product.growthPct)}</span>
            </span>
            <span className="flex items-center gap-1 text-[#D1A264]">
              <span aria-hidden="true" className="text-[25px] leading-none">★</span>
              <span className="text-[#41503D]">{product.reviewCount > 0 ? product.avgRating.toFixed(1) : "-"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function AttentionCard({ product, delay = 0 }) {
  return (
    <div
      className={`${DASHBOARD_POP_CLASS} ${DASHBOARD_INTERACTIVE_CLASS} rounded-[26px] border border-[#E8DDD6] bg-white p-5 shadow-[0_14px_34px_rgba(114,88,64,0.06)]`}
      style={getDashboardPopStyle(delay)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[1.15rem] font-semibold text-[#2F3D2B]">{product.name}</p>
          <p className="mt-2 text-sm text-[#7E8A77]">{product.type || "Tea"}</p>
        </div>
        <span className="rounded-full bg-[#FCEBE7] px-3 py-1 text-xs font-semibold text-[#C36F60]">Needs attention</span>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-[#465242] sm:grid-cols-4">
        <div>
          <p className="text-[#839078]">Sales</p>
          <p className="mt-1 font-semibold text-[#2F3D2B]">{product.sales7d.toLocaleString("th-TH")} units</p>
        </div>
        <div>
          <p className="text-[#839078]">Revenue</p>
          <p className="mt-1 font-semibold text-[#2F3D2B]">{formatCurrency(product.price * product.sales7d)}</p>
        </div>
        <div>
          <p className="text-[#839078]">Rating</p>
          <p className="mt-1 font-semibold text-[#2F3D2B]">{product.reviewCount > 0 ? product.avgRating.toFixed(1) : "No reviews"}</p>
        </div>
        <div>
          <p className="text-[#839078]">Stock</p>
          <p className="mt-1 font-semibold text-[#C36F60]">{product.stock.toLocaleString("th-TH")} units</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-[#E9E2DA] pt-4 text-sm leading-7 text-[#6D7868]">
        {product.issues.map((issue) => (
          <li key={issue}>• {issue}</li>
        ))}
      </ul>
    </div>
  );
}

function InventoryAlertCard({ alert, delay = 0 }) {
  const styles = {
    low: {
      card: "border-[#F2C9C2] bg-[#FFF5F3]",
      icon: "#DE6A5D",
      pill: "bg-[#D96D61] text-white",
      stock: "text-[#8A7268]",
      action: `Reorder ${Math.max(24, alert.sales7d * 3).toLocaleString("th-TH")} units immediately`,
    },
    over: {
      card: "border-[#EEDDBA] bg-[#FFFAEF]",
      icon: "#E1A55E",
      pill: "bg-[#E1A55E] text-white",
      stock: "text-[#8A7A65]",
      action: "Run 20% off promotion",
    },
  };
  const style = styles[alert.kind];

  return (
    <div
      className={`${DASHBOARD_POP_CLASS} ${DASHBOARD_INTERACTIVE_CLASS} rounded-[24px] border px-5 py-6 shadow-[0_10px_24px_rgba(96,110,82,0.04)] ${style.card}`}
      style={getDashboardPopStyle(delay)}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          {alert.kind === "low" ? (
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-7 w-7" fill="none">
              <path d="M10 3.3 17 15.6a1 1 0 0 1-.87 1.5H3.87A1 1 0 0 1 3 15.6L10 3.3Z" stroke={style.icon} strokeWidth="1.6" />
              <path d="M10 7.1v4.7" stroke={style.icon} strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="10" cy="14.2" r="0.9" fill={style.icon} />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-7 w-7" fill="none">
              <path d="M4.2 7.3 10 4l5.8 3.3v5.4L10 16l-5.8-3.3V7.3Z" stroke={style.icon} strokeWidth="1.6" />
              <path d="M4.2 7.3 10 10.7l5.8-3.4" stroke={style.icon} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 10.7V16" stroke={style.icon} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[1.05rem] font-medium text-[#364432]">{alert.name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.95rem]">
            <span className={`rounded-[6px] px-3 py-1 font-semibold leading-none ${style.pill}`}>{alert.title}</span>
            <span className={style.stock}>{alert.stock.toLocaleString("th-TH")} units</span>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[0.98rem] text-[#52655A]">
            <span aria-hidden="true" className="text-[1.2rem] leading-none">→</span>
            <span>{style.action}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ item, delay = 0 }) {
  const tones = {
    olive: "border-[#D8E4D2] bg-[#F4F8F1]",
    mint: "border-[#D7E6D8] bg-[#F0F8F2]",
    amber: "border-[#EADBBB] bg-[#FBF4E6]",
    stone: "border-[#E4E2D8] bg-[#F7F6F0]",
  };

  const Icon = () => {
    if (item.tone === "amber") {
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6 text-[#D7A15F]" fill="none">
          <path d="M4.5 5.5h6l5 5-5 5h-6l-3-5 3-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.8" cy="8" r="1" fill="currentColor" />
        </svg>
      );
    }

    if (item.title.toLowerCase().includes("bundle") || item.title.toLowerCase().includes("double down")) {
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6 text-[#73936D]" fill="none">
          <path d="M4 10.8 8.2 6.6l2.8 2.8 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.4 4.4H16v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (item.title.toLowerCase().includes("restock")) {
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6 text-[#73936D]" fill="none">
          <path d="M4.2 7.3 10 4l5.8 3.3v5.4L10 16l-5.8-3.3V7.3Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.2 7.3 10 10.7l5.8-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 10.7V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6 text-[#73936D]" fill="none">
        <path d="M10 3.6a4.5 4.5 0 0 0-2.9 8v1.6h5.8v-1.6A4.5 4.5 0 0 0 10 3.6Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 15.2h4M8.4 17h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div
      className={`${DASHBOARD_POP_CLASS} ${DASHBOARD_INTERACTIVE_CLASS} rounded-[20px] border px-5 py-5 ${tones[item.tone]}`}
      style={getDashboardPopStyle(delay)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-4xl items-start gap-4">
          <div className="mt-0.5 shrink-0">
            <Icon />
          </div>
          <div>
            <p className="text-[1.05rem] font-semibold text-[#31402D]">{item.title}</p>
            <p className="mt-3 text-[0.98rem] leading-8 text-[#66735F]">{item.text}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#73936D] px-4 py-2 text-[0.95rem] font-semibold uppercase leading-none tracking-[0.04em] text-white">
          {item.impact}
        </span>
      </div>
    </div>
  );
}

export default function SellerAnalyticsDashboard() {
  const { loading, error, shop, products } = useSellerWorkspace();
  const [activeRange, setActiveRange] = useState(7);
  const [trendState, setTrendState] = useState({
    loading: true,
    error: "",
    points: [],
    summary: null,
  });

  useEffect(() => {
    let ignore = false;

    setTrendState((previous) => ({
      ...previous,
      loading: true,
      error: "",
    }));

    fetch(apiUrl(`/orders/seller/trend?days=${activeRange}`), {
      headers: getAuthHeaders(),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            data.error ||
            data.message ||
            `Failed to load revenue trend (HTTP ${response.status || "error"})`;
          throw new Error(message);
        }
        return data;
      })
      .then((data) => {
        if (ignore) return;

        const points = Array.isArray(data.points)
          ? data.points.map((point) => ({
              label: formatDateLabel(new Date(`${point.date}T00:00:00`)),
              tooltipLabel: formatShortDateLabel(new Date(`${point.date}T00:00:00`)),
              date: point.date,
              value: Number(point.revenue || 0),
            }))
          : [];

        setTrendState({
          loading: false,
          error: "",
          points,
          summary: {
            days: Number(data.days || activeRange),
            totalRevenue: Number(data.total_revenue || 0),
            totalUnits: Number(data.total_units || 0),
            startDate: data.start_date || "",
            endDate: data.end_date || "",
          },
        });
      })
      .catch((fetchError) => {
        if (ignore) return;
        setTrendState({
          loading: false,
          error: fetchError.message || "Failed to load revenue trend",
          points: [],
          summary: null,
        });
      });

    return () => {
      ignore = true;
    };
  }, [activeRange]);

  const totalRevenue7d = useMemo(
    () => products.reduce((sum, item) => sum + item.price * item.sales7d, 0),
    [products]
  );
  const totalUnitsSold = useMemo(
    () => products.reduce((sum, item) => sum + item.sales7d, 0),
    [products]
  );
  const totalReviews = useMemo(
    () => products.reduce((sum, item) => sum + item.reviewCount, 0),
    [products]
  );
  const averageRating = useMemo(() => {
    const weighted = products.reduce((sum, item) => sum + item.avgRating * item.reviewCount, 0);
    return totalReviews > 0 ? weighted / totalReviews : 0;
  }, [products, totalReviews]);
  const categoryPerformance = useMemo(() => buildCategoryPerformance(products), [products]);
  const bestSellers = useMemo(() => buildBestSellerRows(products), [products]);
  const attentionProducts = useMemo(() => buildAttentionProducts(products), [products]);
  const inventoryAlerts = useMemo(() => buildInventoryAlerts(products), [products]);

  const strongestCategory = categoryPerformance[0];
  const topSellerShare = totalUnitsSold > 0 && bestSellers[0] ? (bestSellers[0].sales7d / totalUnitsSold) * 100 : 0;
  const lowStockCount = inventoryAlerts.filter((item) => item.kind === "low").length;
  const recommendations = useMemo(
    () => buildRecommendations({
      products,
      bestSellers,
      categoryPerformance,
      attentionProducts,
      inventoryAlerts,
      averageRating,
      totalReviews,
    }),
    [products, bestSellers, categoryPerformance, attentionProducts, inventoryAlerts, averageRating, totalReviews]
  );

  const lastUpdated = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5EF]">
        <SiteNavbar active="seller-dashboard" />
        <div className="mx-auto max-w-[1820px] px-5 py-10 sm:px-6 xl:px-8">
          <div className="h-72 animate-pulse rounded-[34px] bg-[#E8EBDD]" />
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[#F7F5EF]">
        <SiteNavbar active="seller-dashboard" />
        <div className="grid min-h-[calc(100vh-5rem)] place-items-center px-6">
          <div className="max-w-xl rounded-[32px] border border-[#DFE5D6] bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(72,91,59,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Seller Dashboard</p>
            <h1 className="mt-3 font-serif text-[2.6rem] text-[#24321F]">Dashboard unavailable</h1>
            <p className="mt-4 text-[1rem] leading-8 text-[#697563]">{error || "No shop profile found"}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/seller" className="rounded-full bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white">
                Back to Hub
              </Link>
              <Link to="/shop" className="rounded-full border border-[#CDD8C2] px-5 py-3 text-sm font-semibold text-[#567048]">
                Go to Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#253622]">
      <style>{`
        @keyframes dashboardCardPop {
          0% {
            opacity: 0;
            transform: translate3d(0, 14px, 0) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
      <SiteNavbar active="seller-dashboard" />

      <main className="px-3 pb-16 pt-6 sm:px-5 xl:px-6 2xl:px-8">
        <div className="mx-auto flex w-full max-w-[1820px] flex-col gap-8">
          <section
            className={`${DASHBOARD_POP_CLASS} rounded-[36px] border border-[#DFE5D6] bg-white p-7 shadow-[0_18px_44px_rgba(72,91,59,0.08)] sm:p-8`}
            style={getDashboardPopStyle(20)}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">Seller Dashboard</p>
                <h1 className="mt-3 font-serif text-[2.7rem] tracking-[-0.05em] text-[#253622] sm:text-[3.35rem]">
                  Sales decisions for {shop.name}
                </h1>
                <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-[#657160]">
                  A dedicated analytics view for what is selling, what is slowing down, what needs stock attention, and where the next product move should come from.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`${DASHBOARD_POP_CLASS} ${DASHBOARD_INTERACTIVE_CLASS} rounded-[24px] border border-[#E1E8D8] bg-white px-5 py-3 text-right shadow-[0_10px_24px_rgba(72,91,59,0.06)]`}
                  style={getDashboardPopStyle(90)}
                >
                  <p className="text-sm text-[#788472]">{lastUpdated}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#97A38E]">Seller workspace refresh</p>
                </div>
                <Link to="/seller" className="rounded-full border border-[#D3DDC7] bg-white/88 px-5 py-3 text-sm font-semibold text-[#51684A] transition-all hover:bg-[#F3F7ED]">
                  Back to Hub
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard label="Revenue (7d)" value={formatCurrency(totalRevenue7d)} hint="Run-rate from current catalog sales" tone="olive" delay={60} />
            <KpiCard label="Units Sold (7d)" value={totalUnitsSold.toLocaleString("th-TH")} hint={`${products.length} active product(s)`} tone="white" delay={95} />
            <KpiCard label="Avg Rating" value={totalReviews > 0 ? averageRating.toFixed(1) : "-"} hint={totalReviews > 0 ? `${totalReviews.toLocaleString("th-TH")} total reviews` : "No review data yet"} tone="cream" delay={130} />
            <KpiCard label="Top Seller Share" value={formatPercent(topSellerShare)} hint={bestSellers[0] ? `${bestSellers[0].name} leads the mix` : "No leader yet"} tone="white" delay={165} />
            <KpiCard label="Low Stock Items" value={lowStockCount.toLocaleString("th-TH")} hint={lowStockCount > 0 ? "Needs reorder planning" : "No urgent reorder signal"} tone="olive" delay={200} />
            <KpiCard label="Needs Attention" value={attentionProducts.length.toLocaleString("th-TH")} hint={attentionProducts.length > 0 ? "Products with weak movement or drag" : "No major drag found"} tone="cream" delay={235} />
          </section>

          <section
            className={`${DASHBOARD_POP_CLASS} rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7`}
            style={getDashboardPopStyle(120)}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[1.15rem] font-semibold text-[#2B3B27] sm:text-[1.2rem]">Sales Overview</p>
                <p className="mt-1 text-[0.96rem] text-[#7A8572]">Daily revenue performance</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {RANGE_OPTIONS.map((range) => (
                  <RangeButton key={range} value={range} active={activeRange === range} onClick={setActiveRange} />
                ))}
              </div>
            </div>
            <LineTrendChart
              points={trendState.points}
              loading={trendState.loading}
              error={trendState.error}
              summary={trendState.summary}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div
              className={`${DASHBOARD_POP_CLASS} rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7`}
              style={getDashboardPopStyle(160)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[2.1rem] font-semibold tracking-[-0.04em] text-[#263624]">Best Sellers</p>
                  <p className="mt-2 text-[1rem] text-[#6F7C69]">Top performing products this month</p>
                </div>
                <span className="rounded-full bg-[#F4F6EF] px-4 py-2 text-[1rem] text-[#718069]">Top {Math.max(bestSellers.length, 1)}</span>
              </div>
              {bestSellers.length > 0 ? (
                <BestSellerTable rows={bestSellers} />
              ) : (
                <div className="mt-6 rounded-[26px] border border-dashed border-[#D8E0CE] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                  Add products and start moving units to unlock best-seller ranking.
                </div>
              )}
            </div>

            <div
              className={`${DASHBOARD_POP_CLASS} rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7`}
              style={getDashboardPopStyle(190)}
            >
              <p className="text-[1.95rem] font-semibold tracking-[-0.04em] text-[#263624]">Category Performance</p>
              <p className="mt-2 text-sm text-[#6F7C69]">Sales distribution by tea category</p>
              {categoryPerformance.length > 0 ? (
                <CategoryChart items={categoryPerformance.slice(0, 5)} />
              ) : (
                <div className="mt-6 rounded-[26px] border border-dashed border-[#D8E0CE] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                  Category performance appears here once the catalog has products and recent movement.
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div
              className={`${DASHBOARD_POP_CLASS} rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7`}
              style={getDashboardPopStyle(235)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Products Needing Attention</p>
                  <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#263624]">What is dragging efficiency</h2>
                </div>
                <span className="rounded-full bg-[#FDF0EC] px-4 py-2 text-sm text-[#C66C5D]">{attentionProducts.length} flag(s)</span>
              </div>
              {attentionProducts.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {attentionProducts.map((product, index) => (
                    <AttentionCard key={product.id} product={product} delay={230 + index * 35} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[26px] border border-[#DDE7D4] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                  Nothing critical stands out yet. The current catalog is not showing obvious drag in rating, stock pressure, or movement.
                </div>
              )}
            </div>

            <div
              className={`${DASHBOARD_POP_CLASS} rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7`}
              style={getDashboardPopStyle(280)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[1.95rem] font-semibold tracking-[-0.04em] text-[#263624]">Inventory Health</p>
                  <p className="mt-2 text-[1rem] text-[#6F7C69]">Stock alerts and recommendations</p>
                </div>
                <span className="rounded-full bg-[#FDF0EC] px-4 py-2 text-[1rem] text-[#D26A5D]">{inventoryAlerts.length} Critical</span>
              </div>
              {inventoryAlerts.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {inventoryAlerts.map((alert, index) => (
                    <InventoryAlertCard key={`${alert.kind}-${alert.id}`} alert={alert} delay={270 + index * 38} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[26px] border border-[#DDE7D4] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                  Inventory looks balanced right now. No low-stock or overstock condition is strong enough to trigger a dashboard alert.
                </div>
              )}
            </div>
          </section>

          <section
            className={`${DASHBOARD_POP_CLASS} rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7`}
            style={getDashboardPopStyle(320)}
          >
            <div className="flex items-start gap-3">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-6 w-6 text-[#73936D]" fill="none">
                <path d="M10 3.6a4.5 4.5 0 0 0-2.9 8v1.6h5.8v-1.6A4.5 4.5 0 0 0 10 3.6Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 15.2h4M8.4 17h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-[1.95rem] font-semibold tracking-[-0.04em] text-[#263624]">Smart Recommendations</p>
                <p className="mt-2 text-[1rem] text-[#6F7C69]">AI-powered insights to boost your business</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {recommendations.map((item, index) => (
                <RecommendationCard key={item.title} item={item} delay={320 + index * 38} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


