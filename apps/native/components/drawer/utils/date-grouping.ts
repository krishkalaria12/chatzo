import { Thread } from '@/lib/api/chat-api';
import { differenceInDays, isToday, isYesterday } from 'date-fns';

export interface ThreadGroup {
  title: string;
  threads: Thread[];
}

// Memoized group title function
const groupTitleCache = new Map<string, string>();

export const getDateGroupTitle = (date: Date): string => {
  const dateKey = date.toDateString();

  // Check cache first for performance
  if (groupTitleCache.has(dateKey)) {
    return groupTitleCache.get(dateKey)!;
  }

  let title: string;

  if (isToday(date)) {
    title = 'Today';
  } else if (isYesterday(date)) {
    title = 'Yesterday';
  } else {
    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo <= 7) {
      title = 'Last 7 days';
    } else if (daysAgo <= 30) {
      title = 'Last 30 days';
    } else {
      title = 'Older';
    }
  }

  // Cache the result
  groupTitleCache.set(dateKey, title);

  // Prevent memory leaks by limiting cache size
  if (groupTitleCache.size > 100) {
    const firstKey = groupTitleCache.keys().next().value;
    if (firstKey) {
      groupTitleCache.delete(firstKey);
    }
  }

  return title;
};

export const getDaysAgo = (timestamp: number): number => {
  return differenceInDays(new Date(), new Date(timestamp));
};

// Optimized grouping function with better performance
export const groupThreadsByDate = (threads: Thread[]): ThreadGroup[] => {
  if (!threads || threads.length === 0) return [];

  // Sort threads by date (newest first) - use a more efficient sort
  const sortedThreads = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  // Group threads by date ranges using Map for better performance
  const groupsMap = new Map<string, Thread[]>();

  // Process threads in batches for better performance
  const batchSize = 20;
  for (let i = 0; i < sortedThreads.length; i += batchSize) {
    const batch = sortedThreads.slice(i, i + batchSize);

    batch.forEach(thread => {
      const threadDate = new Date(thread.updatedAt);
      const groupTitle = getDateGroupTitle(threadDate);

      if (!groupsMap.has(groupTitle)) {
        groupsMap.set(groupTitle, []);
      }
      groupsMap.get(groupTitle)!.push(thread);
    });
  }

  // Convert to ordered array with proper ordering
  const orderedGroupTitles = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Older'];

  return orderedGroupTitles
    .filter(title => groupsMap.has(title) && groupsMap.get(title)!.length > 0)
    .map(title => ({
      title,
      threads: groupsMap.get(title)!,
    }));
};

// Cleanup function to clear caches if needed
export const clearDateGroupingCache = () => {
  groupTitleCache.clear();
};
