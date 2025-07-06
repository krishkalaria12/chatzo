import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import {
  Search,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { cn } from '@/lib/utils';

interface ToolInvocationProps {
  toolInvocation: {
    state: 'call' | 'result' | 'partial-call';
    args?: any;
    result?: any;
    toolCallId: string;
    toolName: string;
    step?: number;
  };
  className?: string;
}

export const ToolInvocation: React.FC<ToolInvocationProps> = ({ toolInvocation, className }) => {
  const { isDarkColorScheme } = useColorScheme();

  const colors = {
    background: isDarkColorScheme ? '#1f2937' : '#f8fafc',
    border: isDarkColorScheme ? '#374151' : '#e2e8f0',
    text: isDarkColorScheme ? '#f9fafb' : '#1e293b',
    muted: isDarkColorScheme ? '#9ca3af' : '#64748b',
    accent: isDarkColorScheme ? '#3b82f6' : '#2563eb',
    success: isDarkColorScheme ? '#10b981' : '#059669',
    warning: isDarkColorScheme ? '#f59e0b' : '#d97706',
    error: isDarkColorScheme ? '#ef4444' : '#dc2626',
    searchResult: isDarkColorScheme ? '#111827' : '#ffffff',
  };

  const getStateIcon = () => {
    switch (toolInvocation.state) {
      case 'partial-call':
      case 'call':
        return <Clock size={16} color={colors.warning} />;
      case 'result':
        return <CheckCircle size={16} color={colors.success} />;
      default:
        return <AlertCircle size={16} color={colors.muted} />;
    }
  };

  const getStateText = () => {
    switch (toolInvocation.state) {
      case 'partial-call':
        return 'Preparing search...';
      case 'call':
        return 'Searching the web...';
      case 'result':
        return 'Search completed';
      default:
        return 'Unknown state';
    }
  };

  const renderWebSearchArgs = (args: any) => {
    if (!args) return null;

    return (
      <View className='mt-2'>
        <Text style={{ color: colors.muted, fontSize: 12 }} className='font-medium mb-1'>
          Search Query:
        </Text>
        <Text style={{ color: colors.text, fontSize: 14 }} className='italic'>
          "{args.query}"
        </Text>
        {args.scrapeContent && (
          <Text style={{ color: colors.muted, fontSize: 12 }} className='mt-1'>
            • Including detailed content
          </Text>
        )}
      </View>
    );
  };

  const renderWebSearchResults = (result: any) => {
    if (!result || !result.success) {
      return (
        <View className='mt-3'>
          <View className='flex-row items-center mb-2'>
            <XCircle size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 14 }} className='ml-2 font-medium'>
              Search Failed
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {result?.error || 'Unknown error occurred'}
          </Text>
        </View>
      );
    }

    return (
      <View className='mt-3'>
        <View className='flex-row items-center justify-between mb-3'>
          <View className='flex-row items-center'>
            <Search size={16} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 14 }} className='ml-2 font-medium'>
              Found {result.count} results
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>for "{result.query}"</Text>
        </View>

        <ScrollView
          className='max-h-64'
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {result.results?.map((item: any, index: number) => (
            <TouchableOpacity
              key={index}
              className='mb-3 p-3 rounded-lg border'
              style={{
                backgroundColor: colors.searchResult,
                borderColor: colors.border,
              }}
              onPress={() => {
                if (item.url) {
                  Linking.openURL(item.url).catch(err => console.error('Failed to open URL:', err));
                }
              }}
            >
              <View className='flex-row items-start justify-between mb-2'>
                <Text
                  style={{ color: colors.accent, fontSize: 14 }}
                  className='font-semibold flex-1 mr-2'
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <ExternalLink size={14} color={colors.muted} />
              </View>

              {item.description && (
                <Text
                  style={{ color: colors.text, fontSize: 12 }}
                  className='mb-2 leading-4'
                  numberOfLines={3}
                >
                  {item.description}
                </Text>
              )}

              {item.url && (
                <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>
                  {item.url}
                </Text>
              )}

              {item.content && (
                <View className='mt-2 pt-2 border-t' style={{ borderTopColor: colors.border }}>
                  <Text style={{ color: colors.muted, fontSize: 11 }} className='mb-1'>
                    Content Preview:
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 11 }} numberOfLines={4}>
                    {item.content.substring(0, 200)}...
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderGenericTool = () => {
    return (
      <View className='mt-2'>
        <Text style={{ color: colors.muted, fontSize: 12 }} className='font-medium mb-1'>
          Tool: {toolInvocation.toolName}
        </Text>
        {toolInvocation.args && (
          <View className='mt-1'>
            <Text style={{ color: colors.muted, fontSize: 11 }}>Arguments:</Text>
            <Text style={{ color: colors.text, fontSize: 11 }} className='font-mono'>
              {JSON.stringify(toolInvocation.args, null, 2)}
            </Text>
          </View>
        )}
        {toolInvocation.result && (
          <View className='mt-2'>
            <Text style={{ color: colors.muted, fontSize: 11 }}>Result:</Text>
            <Text style={{ color: colors.text, fontSize: 11 }} className='font-mono'>
              {JSON.stringify(toolInvocation.result, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      className={cn('rounded-lg border p-3 my-2', className)}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <View className='flex-row items-center justify-between mb-2'>
        <View className='flex-row items-center'>
          {getStateIcon()}
          <Text style={{ color: colors.text, fontSize: 14 }} className='ml-2 font-medium'>
            {toolInvocation.toolName === 'web_search' ? 'Web Search' : toolInvocation.toolName}
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{getStateText()}</Text>
      </View>

      {/* Content based on tool type and state */}
      {toolInvocation.toolName === 'web_search' ? (
        <>
          {(toolInvocation.state === 'call' || toolInvocation.state === 'partial-call') &&
            renderWebSearchArgs(toolInvocation.args)}
          {toolInvocation.state === 'result' && renderWebSearchResults(toolInvocation.result)}
        </>
      ) : (
        renderGenericTool()
      )}

      {/* Step indicator */}
      {toolInvocation.step !== undefined && (
        <View className='mt-2 pt-2 border-t' style={{ borderTopColor: colors.border }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Step {toolInvocation.step}</Text>
        </View>
      )}
    </View>
  );
};
