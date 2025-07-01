import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Markdown from '@ukdanceblue/react-native-markdown-display';
import CodeHighlighter from 'react-native-code-highlighter';
import { atomOneDarkReasonable, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import * as Clipboard from 'expo-clipboard';
import { Copy, Check } from 'lucide-react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className }) => {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Custom rules for react-native-markdown-display
  const customRules = {
    // Custom code block rule with syntax highlighting
    code_block: (node: any, children: any, parent: any, styles: any) => {
      const code = node.content || '';
      const language = node.sourceInfo || 'text';
      const isCopied = copiedCode === code;

      return (
        <View
          key={node.key}
          style={{
            backgroundColor: isDarkColorScheme ? '#1a202c' : '#f7fafc',
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            marginVertical: 8,
            overflow: 'hidden',
          }}
        >
          {/* Header with language and copy button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: isDarkColorScheme ? '#2d3748' : '#edf2f7',
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'Fira Code',
                fontSize: 11,
                color: theme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {language}
            </Text>

            <TouchableOpacity
              onPress={() => handleCopyCode(code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: isCopied ? CHATZO_COLORS.success + '20' : theme.surface,
              }}
            >
              {isCopied ? (
                <Check size={12} color={CHATZO_COLORS.success} />
              ) : (
                <Copy size={12} color={theme.textSecondary} />
              )}
              <Text
                style={{
                  fontFamily: 'Nunito Sans',
                  fontSize: 11,
                  fontWeight: '500',
                  color: isCopied ? CHATZO_COLORS.success : theme.textSecondary,
                  marginLeft: 4,
                }}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Code content with syntax highlighting */}
          <CodeHighlighter
            hljsStyle={isDarkColorScheme ? atomOneDarkReasonable : atomOneLight}
            textStyle={{
              fontFamily: 'Fira Code',
              fontSize: 13,
              lineHeight: 18,
            }}
            scrollViewProps={{
              contentContainerStyle: {
                padding: 12,
                minWidth: '100%',
              },
              showsHorizontalScrollIndicator: false,
              showsVerticalScrollIndicator: false,
            }}
            language={language}
          >
            {code}
          </CodeHighlighter>
        </View>
      );
    },

    // Custom fence rule (for ```code``` blocks)
    fence: (node: any, children: any, parent: any, styles: any) => {
      const code = node.content || '';
      const language = node.sourceInfo || 'text';
      const isCopied = copiedCode === code;

      return (
        <View
          key={node.key}
          style={{
            backgroundColor: isDarkColorScheme ? '#1a202c' : '#f7fafc',
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            marginVertical: 8,
            overflow: 'hidden',
          }}
        >
          {/* Header with language and copy button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: isDarkColorScheme ? '#2d3748' : '#edf2f7',
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'Fira Code',
                fontSize: 11,
                color: theme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {language}
            </Text>

            <TouchableOpacity
              onPress={() => handleCopyCode(code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: isCopied ? CHATZO_COLORS.success + '20' : theme.surface,
              }}
            >
              {isCopied ? (
                <Check size={12} color={CHATZO_COLORS.success} />
              ) : (
                <Copy size={12} color={theme.textSecondary} />
              )}
              <Text
                style={{
                  fontFamily: 'Nunito Sans',
                  fontSize: 11,
                  fontWeight: '500',
                  color: isCopied ? CHATZO_COLORS.success : theme.textSecondary,
                  marginLeft: 4,
                }}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Code content with syntax highlighting */}
          <CodeHighlighter
            hljsStyle={isDarkColorScheme ? atomOneDarkReasonable : atomOneLight}
            textStyle={{
              fontFamily: 'Fira Code',
              fontSize: 13,
              lineHeight: 18,
            }}
            scrollViewProps={{
              contentContainerStyle: {
                padding: 12,
                minWidth: '100%',
              },
              showsHorizontalScrollIndicator: false,
              showsVerticalScrollIndicator: false,
            }}
            language={language}
          >
            {code}
          </CodeHighlighter>
        </View>
      );
    },
  };

  // Custom styles for react-native-markdown-display
  const markdownStyles = {
    // Body and container
    body: {
      fontFamily: 'Nunito Sans',
      fontSize: 15,
      lineHeight: 23,
      color: theme.text,
      fontWeight: '400',
    },

    // Headings - better font weights and spacing
    heading1: {
      fontFamily: 'Nunito Sans',
      fontSize: 22,
      fontWeight: '700' as const,
      color: theme.text,
      marginTop: 20,
      marginBottom: 14,
      lineHeight: 28,
    },
    heading2: {
      fontFamily: 'Nunito Sans',
      fontSize: 20,
      fontWeight: '700' as const,
      color: theme.text,
      marginTop: 18,
      marginBottom: 12,
      lineHeight: 26,
    },
    heading3: {
      fontFamily: 'Nunito Sans',
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 10,
      lineHeight: 24,
    },
    heading4: {
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginTop: 14,
      marginBottom: 8,
      lineHeight: 22,
    },
    heading5: {
      fontFamily: 'Nunito Sans',
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginTop: 12,
      marginBottom: 6,
      lineHeight: 20,
    },
    heading6: {
      fontFamily: 'Nunito Sans',
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 10,
      marginBottom: 6,
      lineHeight: 18,
    },

    // Paragraphs - improved spacing and weight
    paragraph: {
      fontFamily: 'Nunito Sans',
      fontSize: 15,
      lineHeight: 23,
      color: theme.text,
      marginBottom: 12,
      fontWeight: '400',
    },

    // Text formatting - better weights
    strong: {
      fontFamily: 'Nunito Sans',
      fontWeight: '700' as const,
      color: theme.text,
    },
    em: {
      fontFamily: 'Nunito Sans',
      fontStyle: 'italic' as const,
      color: theme.text,
      fontWeight: '400',
    },
    s: {
      fontFamily: 'Nunito Sans',
      textDecorationLine: 'line-through' as const,
      color: theme.textSecondary,
      fontWeight: '400',
    },

    // Inline code - better contrast
    code_inline: {
      fontFamily: 'Fira Code',
      fontSize: 13,
      backgroundColor: theme.surface,
      color: theme.text,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontWeight: '500',
    },

    // Code blocks (basic styling - enhanced by custom rules)
    code_block: {
      fontFamily: 'Fira Code',
      fontSize: 13,
      color: theme.text,
      fontWeight: '400',
    },
    fence: {
      fontFamily: 'Fira Code',
      fontSize: 13,
      color: theme.text,
      fontWeight: '400',
    },

    // Lists - improved spacing and weights
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    list_item: {
      fontFamily: 'Nunito Sans',
      fontSize: 15,
      lineHeight: 23,
      color: theme.text,
      marginBottom: 4,
      fontWeight: '400',
    },
    bullet_list_icon: {
      color: theme.primary,
      marginRight: 8,
    },
    ordered_list_icon: {
      color: theme.primary,
      marginRight: 8,
    },

    // Blockquotes - better spacing
    blockquote: {
      backgroundColor: isDarkColorScheme
        ? CHATZO_COLORS.primary[900] + '15'
        : CHATZO_COLORS.primary[50],
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
      paddingLeft: 14,
      paddingVertical: 8,
      marginVertical: 12,
      borderRadius: 4,
    },

    // Links
    link: {
      fontFamily: 'Nunito Sans',
      color: theme.primary,
      textDecorationLine: 'underline' as const,
      fontWeight: '500',
    },

    // Tables - refined
    table: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      marginVertical: 12,
      overflow: 'hidden' as const,
    },
    thead: {
      backgroundColor: isDarkColorScheme ? CHATZO_COLORS.gray[800] : CHATZO_COLORS.gray[50],
    },
    tbody: {
      backgroundColor: theme.surface,
    },
    th: {
      fontFamily: 'Nunito Sans',
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      padding: 10,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    td: {
      fontFamily: 'Nunito Sans',
      fontSize: 13,
      color: theme.text,
      padding: 10,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      fontWeight: '400',
    },

    // Horizontal rule
    hr: {
      backgroundColor: theme.border,
      height: 1,
      marginVertical: 18,
    },

    // Images
    image: {
      borderRadius: 6,
      marginVertical: 12,
    },
  };

  return (
    <View className={className}>
      <Markdown style={markdownStyles} rules={customRules as any} mergeStyle={true}>
        {content}
      </Markdown>
    </View>
  );
};
