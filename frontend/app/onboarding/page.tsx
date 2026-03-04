'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface Category {
  readonly id: string;
  readonly label: string;
}

interface Group {
  id: string;
  readonly label: string;
  readonly emoji: string;
  readonly categories: ReadonlyArray<Category>;
}

const INITIAL_GROUPS: Group[] = [
  {
    id: 'technology',
    label: 'Technology',
    emoji: '💻',
    categories: [
      { id: 'android', label: 'Android' },
      { id: 'android-dev', label: 'Android Dev' },
      { id: 'apple', label: 'Apple' },
      { id: 'ios-dev', label: 'iOS Dev' },
      { id: 'tech', label: 'Tech' },
      { id: 'web-dev', label: 'Web Dev' },
      { id: 'programming', label: 'Coding' },
      { id: 'ui-ux', label: 'UI/UX' },
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    emoji: '🎬',
    categories: [
      { id: 'movies', label: 'Movies' },
      { id: 'television', label: 'TV' },
      { id: 'gaming', label: 'Gaming' },
      { id: 'music', label: 'Music' },
      { id: 'funny', label: 'Comedy' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    categories: [
      { id: 'sports-general', label: 'Sports' },
      { id: 'football', label: 'Football' },
      { id: 'cricket', label: 'Cricket' },
      { id: 'tennis', label: 'Tennis' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    emoji: '📈',
    categories: [
      { id: 'business-economy', label: 'Economy' },
      { id: 'startups', label: 'Startups' },
      { id: 'personal-finance', label: 'Finance' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    emoji: '🌿',
    categories: [
      { id: 'beauty', label: 'Beauty' },
      { id: 'fashion', label: 'Fashion' },
      { id: 'food', label: 'Food' },
      { id: 'travel', label: 'Travel' },
      { id: 'diy', label: 'DIY' },
      { id: 'interior-design', label: 'Design' },
      { id: 'cars', label: 'Cars' },
      { id: 'books', label: 'Books' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    emoji: '🔭',
    categories: [
      { id: 'science', label: 'Science' },
      { id: 'space', label: 'Space' },
      { id: 'history', label: 'History' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'photography', label: 'Photos' },
      { id: 'news', label: 'News' },
    ],
  },
  {
    id: 'world',
    label: 'World',
    emoji: '🌍',
    categories: [
      { id: 'world-au', label: '🇦🇺 AU' },
      { id: 'world-ca', label: '🇨🇦 CA' },
      { id: 'world-de', label: '🇩🇪 DE' },
      { id: 'world-fr', label: '🇫🇷 FR' },
      { id: 'world-gb', label: '🇬🇧 UK' },
      { id: 'world-in', label: '🇮🇳 IN' },
      { id: 'world-jp', label: '🇯🇵 JP' },
      { id: 'world-mx', label: '🇲🇽 MX' },
      { id: 'world-us', label: '🇺🇸 US' },
    ],
  },
];

// Combine everything into a flat array of nodes so Framer Motion can render them all continuously
type NodeType = 'group' | 'category';
interface FlatNode {
  id: string;
  type: NodeType;
  groupId: string;
  label: string;
  emoji: string;
}

const ALL_NODES: FlatNode[] = INITIAL_GROUPS.flatMap(g => [
  { id: g.id, type: 'group', groupId: g.id, label: g.label, emoji: g.emoji },
  ...g.categories.map(c => ({
    id: c.id, type: 'category' as NodeType, groupId: g.id, label: c.label, emoji: g.emoji
  }))
]);

// Physics and Layout Constants
const BASE_BUBBLE_SIZE = 96;
const L2_SCALE = 0.85;
const PADDING = 8;
const MIN_RADIUS = 35;
const MAX_RADIUS = 75;

// Generate specific sizes for every node based on its label text length
function calculateNodeRadius(node: FlatNode): number {
  const baseFontSize = node.type === 'group' ? 14 : 12;
  // Increase character width multiplier and base horizontal padding
  const estimatedWidth = node.label.length * (baseFontSize * 0.9) + 50;
  // Give it slightly larger max bounds so words fit safely
  const r = Math.min(100, Math.max(45, estimatedWidth / 2));
  return r * (node.type === 'group' ? 1 : L2_SCALE);
}

// Compute radii once
const NODE_RADII = new Map(ALL_NODES.map(n => [n.id, calculateNodeRadius(n)]));

interface BubbleProps {
  id: string;
  label: string;
  isSelected: boolean;
  isGroupSelected: boolean;
  isGroup: boolean;
  onTap: (id: string) => void;
  selectedCount?: number;
  radius: number;
}

function Bubble({ id, label, isSelected, isGroupSelected, isGroup, onTap, selectedCount, radius }: BubbleProps) {
  // Premium Aesthetic Styling
  // Layer 1 (Groups) - Richer background, larger text
  // Layer 2 (Categories) - Softer background, smaller text
  // Selected (Active) - High Contrast Blue

  const baseClasses = "absolute top-0 left-0 flex flex-col items-center justify-center p-3 rounded-full transform transition-all duration-300 gap-1";

  let specificStyles = "";
  let textStyles = "";

  if (isSelected) {
    // Selected Category (Layer 2) - Medium Gray (distinct from Layer 1)
    specificStyles = "bg-[#A1A1AA] text-white border border-[#71717A] shadow-inner";
    textStyles = "font-sans font-bold text-center leading-[1.2] text-white tracking-wide";
  } else if (isGroup && isGroupSelected) {
    // Active/Expanded Group (Layer 1)
    specificStyles = "bg-[#111111] text-white border-2 border-white ring-2 ring-[#111111]";
    textStyles = "font-sans font-bold text-center leading-[1.2] text-white tracking-tight";
  } else if (isGroup) {
    // Inactive Group (Layer 1) - Darker contrast
    specificStyles = "bg-[#27272A] text-white hover:bg-[#18181B] border border-[#3F3F46]";
    textStyles = "font-sans font-medium text-center leading-[1.2] text-white tracking-normal";
  } else {
    // Unselected Category (Layer 2) - Lighter background, dark text
    specificStyles = "bg-[#F4F4F5] text-[#27272A] hover:bg-[#E4E4E7] hover:text-black border border-[#D4D4D8]";
    textStyles = "font-sans font-medium text-center leading-[1.2] text-[#27272A] tracking-normal";
  }

  const fontSize = isGroup ? 'text-[14px]' : 'text-[12px]';

  return (
    <button
      onClick={() => onTap(id)}
      className={`${baseClasses} ${specificStyles}`}
      style={{
        width: radius * 2,
        height: radius * 2,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span className={`${fontSize} ${textStyles} whitespace-nowrap overflow-hidden text-ellipsis px-1 w-full text-center`}>
        {label}
      </span>
      {isSelected && (
        <div className="absolute inset-0 rounded-full ring-1 ring-white/20 pointer-events-none" />
      )}
      {selectedCount !== undefined && selectedCount > 0 && (
        <div className="size-5 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/50 z-20">
          <span className="font-sans text-[10px] text-white font-bold leading-none">
            {selectedCount}
          </span>
        </div>
      )}
    </button>
  );
}

function OnboardingContent() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get('back') ?? '/signup';

  const [usableSize, setUsableSize] = useState({ width: 350, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      setUsableSize({
        width: Math.max(300, window.innerWidth - 32),
        height: Math.max(400, window.innerHeight - 300)
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function toggleCategory(categoryId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function handleGroupTap(groupId: string) {
    setExpandedGroup(prev => prev === groupId ? null : groupId);
  }

  // Calculate coordinates dynamically using a circle-packing physics solver
  const layoutMap = useMemo(() => {
    const map = new Map<string, { x: number, y: number, scale: number }>();

    // 1. Define active (visible) nodes based on expanded state
    const activeNodes: (FlatNode & { x: number, y: number, r: number, vx: number, vy: number })[] = [];

    if (!expandedGroup) {
      // Show only groups
      INITIAL_GROUPS.forEach(g => {
        activeNodes.push({ ...g, type: 'group', groupId: g.id, x: Math.random() - 0.5, y: Math.random() - 0.5, r: NODE_RADII.get(g.id)! + PADDING, vx: 0, vy: 0 });
      });
    } else {
      // Show expanded group, its categories, and other groups
      const expanded = INITIAL_GROUPS.find(g => g.id === expandedGroup)!;
      const others = INITIAL_GROUPS.filter(g => g.id !== expandedGroup);

      activeNodes.push({ ...expanded, type: 'group', groupId: expanded.id, x: 0, y: 0, r: NODE_RADII.get(expanded.id)! + PADDING, vx: 0, vy: 0 });

      expanded.categories.forEach(cat => {
        activeNodes.push({ ...cat, type: 'category', groupId: expanded.id, emoji: expanded.emoji, x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10, r: NODE_RADII.get(cat.id)! + PADDING, vx: 0, vy: 0 });
      });

      others.forEach(g => {
        activeNodes.push({ ...g, type: 'group', groupId: g.id, x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50, r: NODE_RADII.get(g.id)! + PADDING, vx: 0, vy: 0 });
      });
    }

    // 2. Run Strict Position Relaxation to pack circles
    const iterations = 150;
    const centerAttraction = 0.015;

    for (let i = 0; i < iterations; i++) {
      // Attract to center (0,0)
      for (const node of activeNodes) {
        if (node.id === expandedGroup) {
          // Lock the expanded group to the absolute center
          node.x = 0;
          node.y = 0;
        } else {
          node.x -= node.x * centerAttraction;
          node.y -= node.y * centerAttraction;
        }
      }

      // Strictly separate overlapping circles
      for (let a = 0; a < activeNodes.length; a++) {
        for (let b = a + 1; b < activeNodes.length; b++) {
          const nodeA = activeNodes[a];
          const nodeB = activeNodes[b];

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = nodeA.r + nodeB.r;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dist === 0 ? (Math.random() - 0.5) : dx / dist;
            const ny = dist === 0 ? (Math.random() - 0.5) : dy / dist;

            const correctionX = nx * (overlap / 2);
            const correctionY = ny * (overlap / 2);

            if (nodeA.id !== expandedGroup && nodeB.id !== expandedGroup) {
              nodeA.x -= correctionX;
              nodeA.y -= correctionY;
              nodeB.x += correctionX;
              nodeB.y += correctionY;
            } else if (nodeA.id === expandedGroup) {
              nodeB.x += nx * overlap;
              nodeB.y += ny * overlap;
            } else if (nodeB.id === expandedGroup) {
              nodeA.x -= nx * overlap;
              nodeA.y -= ny * overlap;
            }
          }
        }
      }
    }

    // 3. Map back to layout map with scale 1
    activeNodes.forEach(node => {
      map.set(node.id, { x: node.x, y: node.y, scale: 1 });
    });

    // 4. Default non-active nodes to center/parent with scale 0
    ALL_NODES.forEach(n => {
      if (!map.has(n.id)) {
        const parentGroup = activeNodes.find(a => a.id === n.groupId);
        if (parentGroup) {
          map.set(n.id, { x: parentGroup.x, y: parentGroup.y, scale: 0 });
        } else {
          map.set(n.id, { x: 0, y: 0, scale: 0 });
        }
      }
    });

    return map;
  }, [expandedGroup]);

  // Determine the collective bounding box of currently visible elements (scale === 1)
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  const visibleNodes = ALL_NODES.filter(n => layoutMap.get(n.id)?.scale === 1);

  if (visibleNodes.length > 0) {
    minX = Math.min(...visibleNodes.map(v => layoutMap.get(v.id)!.x - (NODE_RADII.get(v.id) || 50)));
    maxX = Math.max(...visibleNodes.map(v => layoutMap.get(v.id)!.x + (NODE_RADII.get(v.id) || 50)));
    minY = Math.min(...visibleNodes.map(v => layoutMap.get(v.id)!.y - (NODE_RADII.get(v.id) || 50)));
    maxY = Math.max(...visibleNodes.map(v => layoutMap.get(v.id)!.y + (NODE_RADII.get(v.id) || 50)));
  }

  const boxWidth = maxX - minX || 100;
  const boxHeight = maxY - minY || 100;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Compute a scale that fits the entire bounding box perfectly inside usableScreen
  const SCREEN_PADDING = 40;
  const targetScale = Math.min(
    usableSize.width / (boxWidth + SCREEN_PADDING),
    usableSize.height / (boxHeight + SCREEN_PADDING)
  );

  const boundedScale = Math.min(targetScale, 1.25);
  const containerX = -centerX * boundedScale;
  const containerY = -centerY * boundedScale;

  return (
    <div className="fixed inset-0 bg-[#f4f4f0] overflow-hidden flex flex-col touch-none">
      {/* Top nav (Floats above canvas) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 h-17 pointer-events-none">
        {/* Dynamic Left Action: Go Back or Exit */}
        {expandedGroup ? (
          <button
            type="button"
            onClick={() => setExpandedGroup(null)}
            className="flex items-center gap-2 pointer-events-auto transition-transform active:scale-95"
          >
            <div className="flex items-center justify-center h-9 px-4 rounded-full bg-white/80 backdrop-blur-md border border-[#e0e0d8] shadow-sm">
              <span className="font-sans font-bold text-[10px] text-[rgba(17,17,17,0.8)] tracking-[1px] uppercase">
                ← Back
              </span>
            </div>
          </button>
        ) : (
          <Link href={backHref} className="flex items-center gap-2 pointer-events-auto transition-transform active:scale-95">
            <div className="flex items-center justify-center size-9 rounded-full bg-white/80 backdrop-blur-md border border-[#e0e0d8] shadow-sm">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M12 15L7 10L12 5"
                  stroke="#111"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-sans font-bold text-[10px] text-[rgba(17,17,17,0.6)] tracking-[1px] uppercase">
              Exit
            </span>
          </Link>
        )}

        <div className="flex flex-col items-center gap-1 pointer-events-auto filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
          <span className="font-sans font-bold text-[10px] text-[rgba(0,0,0,0.5)] tracking-[3px] uppercase mt-1">
            {expandedGroup ? INITIAL_GROUPS.find(g => g.id === expandedGroup)?.label : 'VOX CURATION'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="font-sans font-bold text-[10px] text-[rgba(17,17,17,0.4)] tracking-[1px] uppercase pointer-events-auto transition-transform active:scale-95"
        >
          Skip
        </button>
      </div>

      {/* Main Single-Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Auto-scaling container that ensures everything stays nicely in bounds and centered */}
        <motion.div
          initial={false}
          animate={{ x: containerX, y: containerY, scale: boundedScale }}
          transition={{ type: 'spring', damping: 25, stiffness: 180, mass: 0.8 }}
          className="absolute top-1/2 left-1/2 w-0 h-0"
        >
          {ALL_NODES.map((node) => {
            const layout = layoutMap.get(node.id) || { x: 0, y: 0, scale: 0 };
            const isVisible = layout.scale === 1;
            const isSelected = node.type === 'category' && selected.has(node.id);
            const isGroupSelected = node.type === 'group' && expandedGroup === node.groupId;

            const selectedCount = node.type === 'group'
              ? INITIAL_GROUPS.find(g => g.id === node.id)?.categories.filter(c => selected.has(c.id)).length
              : undefined;

            return (
              <motion.div
                key={`${node.type}-${node.id}`}
                initial={false}
                animate={{
                  x: layout.x,
                  y: layout.y,
                  scale: layout.scale,
                  opacity: layout.scale,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  zIndex: isVisible ? 10 : 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute"
              >
                <Bubble
                  id={node.id}
                  label={node.label}
                  radius={NODE_RADII.get(node.id) || 50}
                  isGroup={node.type === 'group'}
                  isSelected={isSelected}
                  isGroupSelected={isGroupSelected}
                  onTap={node.type === 'group' ? handleGroupTap : toggleCategory}
                  selectedCount={selectedCount}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom CTA (Floats above canvas) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        {/* Helper text overlay */}
        <div className="absolute bottom-28 left-0 right-0 flex justify-center opacity-40 pointer-events-none pb-4">
          <p className="font-serif italic text-[14px] text-[#444] bg-white/60 backdrop-blur-sm px-5 py-2 rounded-full shadow-sm">
            {expandedGroup ? 'Select your specific interests' : 'Tap a group to expand categories'}
          </p>
        </div>

        <div className="bg-gradient-to-t from-[#f4f4f0] via-[#f4f4f0]/95 to-transparent px-6 pt-24 pb-8 pointer-events-auto">
          {selected.size > 0 && (
            <div className="flex justify-center mb-5">
              <div className="flex items-center gap-4 px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-sm border border-white">
                <span className="font-sans font-bold text-[10px] text-black/70 tracking-[2px] uppercase">
                  {selected.size} RESONANCE{selected.size !== 1 ? 'S' : ''} SELECTED
                </span>
                <div className="size-[4px] rounded-full bg-black/20" />
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="font-sans font-bold text-[10px] text-black/60 tracking-[1px] uppercase hover:text-black transition-colors"
                >
                  CLEAR
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push('/explore')}
            className="w-full h-14 bg-black rounded-full shadow-[0px_10px_30px_rgba(0,0,0,0.15)] font-sans font-bold text-[12px] text-white tracking-[2.5px] uppercase transition-transform active:scale-[0.98]"
          >
            ENTER VOX
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
