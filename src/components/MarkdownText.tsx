import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  content: string;
  style?: TextStyle;
  boldStyle?: TextStyle;
}

/**
 * A basic markdown/HTML-lite parser for React Native.
 * Handles **bold**, <b>bold</b>, *italic*, <i>italic</i>.
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, style, boldStyle }) => {
  if (!content) return null;

  // Regex to match **bold** or <b>bold</b> or *italic* or <i>italic</i>
  // We'll simplify to just bold for now as requested/needed
  const parts = content.split(/(\*\*.*?\*\*|<b>.*?<\/b>|\*.*?\*|<i>.*?<\/i>)/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('<b>') && part.endsWith('</b>'))) {
          const text = part.replace(/\*\*|<b>|<\/b>/g, '');
          return (
            <Text key={index} style={[styles.bold, boldStyle]}>
              {text}
            </Text>
          );
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('<i>') && part.endsWith('</i>'))) {
          const text = part.replace(/\*|<i>|<\/i>/g, '');
          return (
            <Text key={index} style={styles.italic}>
              {text}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
});

export default MarkdownText;
