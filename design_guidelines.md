# EverLink Monitoring Bot - Design Guidelines

## Project Type: Discord Bot Interface Design
This is a Discord bot application with no web frontend. All design focuses on message formatting and command responses within Discord's native interface.

## Design Approach
**System-Based**: Following Discord's native design patterns and embed formatting standards to ensure familiarity and consistency with Discord's ecosystem.

## Core Design Principles

### 1. Typography & Message Formatting
- **Primary Font**: Use Discord's default system fonts (no custom fonts possible)
- **Hierarchy**: 
  - Command responses use bold for labels: `**Status:**`, `**Last Heartbeat:**`
  - Timestamps in regular weight
  - Use inline code blocks for technical data: `` `8 minutes ago` ``

### 2. Status Indicators
**Visual Symbols**:
- Online: ✅ (green checkmark)
- Offline: ❌ (red X)
- Warning/Degraded: ⚠️ (yellow warning)
- Info: ℹ️ (blue info)

**Status Messages**:
- Online: `✅ EverLink Status: **Online**`
- Offline: `❌ EverLink Status: **Offline**`
- Include human-readable timestamps: "2 minutes ago" not "120 seconds"

### 3. Discord Embed Structure for /status Command

**Embed Layout**:
- **Color Coding**:
  - Green (#57F287) for online
  - Red (#ED4245) for offline
  - Yellow (#FEE75C) for degraded/warning states
  
- **Embed Title**: "EverLink Monitor Status"

- **Embed Fields**:
  - **Current Status**: Online/Offline with emoji
  - **Last Heartbeat**: Relative timestamp (e.g., "3 minutes ago")
  - **Next Expected**: Calculated estimate (e.g., "in 5 minutes")

- **Footer**: Include bot version and timestamp of status check

### 4. Response Timing & UX
- Command responses should be instant (<500ms)
- Use ephemeral messages (visible only to command user) for routine checks
- Use channel messages for critical alerts
- Maintain consistent message format across all responses

### 5. Error & Alert Messaging
- **Offline Alert Format**: 
  ```
  🚨 **ALERT: EverLink Offline**
  Last heartbeat: 15 minutes ago
  Expected heartbeat missed at: [timestamp]
  ```
- Keep error messages concise and actionable
- Include relevant timestamps and context

### 6. Component Structure

**Status Command Response**:
- Embed with status color
- Clear status indicator (emoji + text)
- Timestamp information
- Footer with metadata

**No Animations**: Discord bots cannot include custom animations

**No Images**: Status responses use embeds and text only - no external images

## Spacing & Layout
- Use single line breaks between sections
- Indent nested information with `  →` or similar
- Keep responses compact (3-5 lines maximum)

## Accessibility
- Always pair emojis with text labels
- Use clear, descriptive language
- Maintain high contrast with Discord's dark/light themes

## Example Output Format
```
✅ **EverLink Status: Online**
Last heartbeat: 3 minutes ago
Next expected: in 5 minutes
```

This design focuses on clarity, quick readability, and consistency with Discord's native patterns.