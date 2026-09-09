<?php
declare(strict_types=1);

namespace Neutral\Core;

final class UserUiDesign
{
    public const SCHEMA_VERSION = 2;
    public const MAX_CUSTOM_CSS = 20000;

    /** @return array<string,mixed> */
    public static function defaults(): array
    {
        return [
            'schemaVersion' => self::SCHEMA_VERSION,
            'light' => ['background' => '#f3f6fb', 'surface' => '#ffffff', 'primary' => '#2f6fed', 'text' => '#1c2432', 'muted' => '#5f7087', 'border' => '#dfe7f3', 'primaryBackground' => '#2f6fed', 'primaryText' => '#ffffff', 'primaryIcon' => '#ffffff', 'primaryBorder' => '#1d4fd7', 'secondaryBackground' => '#ffffff', 'secondaryText' => '#1c2432', 'secondaryIcon' => '#1c2432', 'secondaryBorder' => '#aebdd2', 'navActiveBackground' => '#2f6fed', 'navActiveText' => '#ffffff', 'navActiveIcon' => '#ffffff', 'navActiveBorder' => '#1d4fd7', 'navInactiveBackground' => '#ffffff', 'navInactiveText' => '#1c2432', 'navInactiveIcon' => '#1c2432', 'navInactiveBorder' => '#aebdd2', 'inputBackground' => '#ffffff', 'inputText' => '#1c2432', 'inputBorder' => '#7b8da8', 'inputFocus' => '#174db7'],
            'dark' => ['background' => '#0b1220', 'surface' => '#111b2d', 'primary' => '#7aa2ff', 'text' => '#edf3ff', 'muted' => '#9db0c8', 'border' => '#506584', 'primaryBackground' => '#547bd5', 'primaryText' => '#ffffff', 'primaryIcon' => '#ffffff', 'primaryBorder' => '#86a8fa', 'secondaryBackground' => '#17263d', 'secondaryText' => '#edf3ff', 'secondaryIcon' => '#edf3ff', 'secondaryBorder' => '#6f86a8', 'navActiveBackground' => '#547bd5', 'navActiveText' => '#ffffff', 'navActiveIcon' => '#ffffff', 'navActiveBorder' => '#a6bdff', 'navInactiveBackground' => '#17263d', 'navInactiveText' => '#edf3ff', 'navInactiveIcon' => '#edf3ff', 'navInactiveBorder' => '#6f86a8', 'inputBackground' => '#0f1a2b', 'inputText' => '#edf3ff', 'inputBorder' => '#7890b4', 'inputFocus' => '#a6bdff'],
            'geometry' => ['controlRadius' => 11, 'surfaceRadius' => 18, 'contentMaxWidth' => 1120],
            'typography' => ['baseFontSize' => 16],
            'customCss' => '',
        ];
    }

    /** @param mixed $value @return array<string,mixed> */
    public static function normalize($value, bool $strict = false): array
    {
        $candidate = is_array($value) ? $value : [];
        $result = self::defaults();
        $errors = [];
        foreach (array_keys($candidate) as $key) if (!in_array($key, ['schemaVersion', 'light', 'dark', 'geometry', 'typography', 'customCss'], true)) $errors[] = 'Unknown design property: ' . $key;
        if (isset($candidate['schemaVersion']) && !in_array($candidate['schemaVersion'], [1, self::SCHEMA_VERSION], true)) $errors[] = 'Unsupported user UI design schemaVersion';
        $colorKeys = ['background', 'surface', 'primary', 'text', 'muted', 'border', 'primaryBackground', 'primaryText', 'primaryIcon', 'primaryBorder', 'secondaryBackground', 'secondaryText', 'secondaryIcon', 'secondaryBorder', 'navActiveBackground', 'navActiveText', 'navActiveIcon', 'navActiveBorder', 'navInactiveBackground', 'navInactiveText', 'navInactiveIcon', 'navInactiveBorder', 'inputBackground', 'inputText', 'inputBorder', 'inputFocus'];
        foreach (['light', 'dark'] as $mode) {
            if (isset($candidate[$mode]) && !is_array($candidate[$mode])) $errors[] = $mode . ' must be an object';
            if (!is_array($candidate[$mode] ?? null)) continue;
            foreach (array_keys($candidate[$mode]) as $key) if (!in_array($key, $colorKeys, true)) $errors[] = 'Unknown ' . $mode . ' token: ' . $key;
            foreach ($colorKeys as $key) if (array_key_exists($key, $candidate[$mode])) {
                $color = (string) $candidate[$mode][$key];
                if (!preg_match('/^#[0-9a-fA-F]{6}$/', $color)) $errors[] = $mode . '.' . $key . ' must be a six-digit hex color';
                else $result[$mode][$key] = strtolower($color);
            }
        }
        foreach (['geometry' => ['controlRadius' => [0, 32], 'surfaceRadius' => [0, 48], 'contentMaxWidth' => [320, 1920]], 'typography' => ['baseFontSize' => [12, 24]]] as $section => $rules) {
            if (isset($candidate[$section]) && !is_array($candidate[$section])) $errors[] = $section . ' must be an object';
            if (!is_array($candidate[$section] ?? null)) continue;
            foreach (array_keys($candidate[$section]) as $key) if (!isset($rules[$key])) $errors[] = 'Unknown ' . $section . ' token: ' . $key;
            foreach ($rules as $key => [$min, $max]) if (array_key_exists($key, $candidate[$section])) {
                $number = filter_var($candidate[$section][$key], FILTER_VALIDATE_FLOAT);
                if ($number === false || $number < $min || $number > $max) $errors[] = $section . '.' . $key . ' is outside its supported range';
                else $result[$section][$key] = $number + 0;
            }
        }
        if (array_key_exists('customCss', $candidate)) {
            $css = is_string($candidate['customCss']) ? $candidate['customCss'] : '';
            if (!is_string($candidate['customCss']) || strlen($css) > self::MAX_CUSTOM_CSS || preg_match('/<\/style|@import|javascript:/i', $css)) $errors[] = 'customCss is invalid';
            else $result['customCss'] = $css;
        }
        if ($strict && $errors) throw new \RuntimeException(implode(', ', $errors));
        return $errors ? self::defaults() : $result;
    }
}
