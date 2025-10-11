/**
 * JMI Seller Shared PropTypes - Reusable prop validation
 * 
 * This file contains common PropType definitions used across components
 * to ensure consistency and reduce code duplication.
 */

import PropTypes from 'prop-types';

// Common size variants for components
export const SizeVariant = PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']);

// Color variants based on design system
export const ColorVariant = PropTypes.oneOf([
  'primary',
  'secondary', 
  'success',
  'warning',
  'error',
  'gray',
  'white'
]);

// Button variants
export const ButtonVariant = PropTypes.oneOf([
  'primary',
  'secondary',
  'success',
  'warning', 
  'error',
  'outline',
  'ghost',
  'link'
]);

// Common spacing values
export const SpacingValue = PropTypes.oneOf([
  'none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
]);

// Responsive breakpoint values
export const BreakpointValue = PropTypes.oneOf(['sm', 'md', 'lg', 'xl']);

// Common alignment options
export const AlignmentValue = PropTypes.oneOf([
  'left', 'center', 'right', 'justify'
]);

// Common position values
export const PositionValue = PropTypes.oneOf([
  'static', 'relative', 'absolute', 'fixed', 'sticky'
]);

// Text size variants
export const TextSize = PropTypes.oneOf([
  '2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'
]);

// Font weight variants
export const FontWeight = PropTypes.oneOf([
  'light', 'normal', 'medium', 'semibold', 'bold'
]);

// Common component states
export const ComponentState = PropTypes.oneOf([
  'default', 'hover', 'focus', 'active', 'disabled', 'loading'
]);

// Navigation item shape
export const NavigationItem = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  href: PropTypes.string,
  icon: PropTypes.elementType,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isActive: PropTypes.bool,
  isDisabled: PropTypes.bool,
  children: PropTypes.array
});

// User object shape
export const User = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  role: PropTypes.string,
  isActive: PropTypes.bool
});

// Product object shape  
export const Product = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  price: PropTypes.number,
  currency: PropTypes.string,
  image: PropTypes.string,
  category: PropTypes.string,
  status: PropTypes.oneOf(['active', 'inactive', 'draft']),
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string
});

// Order object shape
export const Order = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  orderNumber: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  total: PropTypes.number.isRequired,
  currency: PropTypes.string,
  items: PropTypes.arrayOf(Product),
  customer: User,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string
});

// Form field configuration
export const FormField = PropTypes.shape({
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf([
    'text', 'email', 'password', 'number', 'tel', 'url', 
    'textarea', 'select', 'checkbox', 'radio', 'file', 'date'
  ]).isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  })),
  validation: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
    pattern: PropTypes.string,
    custom: PropTypes.func
  }),
  help: PropTypes.string,
  error: PropTypes.string
});

// Step object shape (for step indicators, wizards)
export const Step = PropTypes.shape({
  number: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  isCompleted: PropTypes.bool,
  isActive: PropTypes.bool,
  hasError: PropTypes.bool,
  isDisabled: PropTypes.bool,
  component: PropTypes.elementType,
  data: PropTypes.object
});

// Card configuration
export const CardConfig = PropTypes.shape({
  title: PropTypes.string,
  subtitle: PropTypes.string,
  image: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    variant: ButtonVariant,
    disabled: PropTypes.bool
  })),
  badge: PropTypes.shape({
    label: PropTypes.string.isRequired,
    variant: ColorVariant
  }),
  href: PropTypes.string,
  isLoading: PropTypes.bool
});

// Table column configuration
export const TableColumn = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  dataIndex: PropTypes.string,
  render: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  align: AlignmentValue,
  sortable: PropTypes.bool,
  filterable: PropTypes.bool,
  fixed: PropTypes.oneOf(['left', 'right']),
  ellipsis: PropTypes.bool
});

// Pagination configuration
export const PaginationConfig = PropTypes.shape({
  current: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  showSizeChanger: PropTypes.bool,
  showQuickJumper: PropTypes.bool,
  showTotal: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  onShowSizeChange: PropTypes.func
});

// Modal configuration
export const ModalConfig = PropTypes.shape({
  title: PropTypes.string,
  content: PropTypes.node,
  footer: PropTypes.node,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  closable: PropTypes.bool,
  maskClosable: PropTypes.bool,
  keyboard: PropTypes.bool,
  centered: PropTypes.bool,
  destroyOnClose: PropTypes.bool,
  onOk: PropTypes.func,
  onCancel: PropTypes.func
});

// Notification configuration
export const NotificationConfig = PropTypes.shape({
  message: PropTypes.string.isRequired,
  description: PropTypes.string,
  type: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
  duration: PropTypes.number,
  placement: PropTypes.oneOf([
    'top', 'topLeft', 'topRight', 
    'bottom', 'bottomLeft', 'bottomRight'
  ]),
  icon: PropTypes.node,
  onClose: PropTypes.func
});

// Theme configuration
export const ThemeConfig = PropTypes.shape({
  mode: PropTypes.oneOf(['light', 'dark', 'auto']),
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  borderRadius: PropTypes.number,
  fontSize: PropTypes.number,
  fontFamily: PropTypes.string
});

// API response shape
export const ApiResponse = PropTypes.shape({
  data: PropTypes.any,
  message: PropTypes.string,
  success: PropTypes.bool.isRequired,
  status: PropTypes.number,
  errors: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string,
    message: PropTypes.string.isRequired,
    code: PropTypes.string
  })),
  meta: PropTypes.shape({
    page: PropTypes.number,
    limit: PropTypes.number,
    total: PropTypes.number,
    totalPages: PropTypes.number
  })
});

// File upload configuration
export const FileUploadConfig = PropTypes.shape({
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number, // in bytes
  maxFiles: PropTypes.number,
  showPreview: PropTypes.bool,
  showProgress: PropTypes.bool,
  uploadUrl: PropTypes.string,
  headers: PropTypes.object,
  onUpload: PropTypes.func,
  onProgress: PropTypes.func,
  onSuccess: PropTypes.func,
  onError: PropTypes.func
});

// Charts/Data visualization props
export const ChartData = PropTypes.shape({
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  datasets: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    data: PropTypes.arrayOf(PropTypes.number).isRequired,
    backgroundColor: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    borderColor: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    borderWidth: PropTypes.number
  })).isRequired
});

// Date range configuration
export const DateRange = PropTypes.shape({
  start: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  format: PropTypes.string,
  allowClear: PropTypes.bool,
  placeholder: PropTypes.arrayOf(PropTypes.string)
});

// Search configuration
export const SearchConfig = PropTypes.shape({
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  allowClear: PropTypes.bool,
  enterButton: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  size: SizeVariant,
  loading: PropTypes.bool,
  onSearch: PropTypes.func,
  onChange: PropTypes.func
});

// Filter configuration for tables/lists
export const FilterConfig = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['text', 'select', 'multiSelect', 'date', 'dateRange', 'number']),
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired
  })),
  defaultValue: PropTypes.any,
  placeholder: PropTypes.string
});

// Common event handlers
export const EventHandlers = {
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
  onSubmit: PropTypes.func
};

// Common HTML attributes
export const HtmlAttributes = {
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.string,
  role: PropTypes.string,
  tabIndex: PropTypes.number,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  'aria-describedby': PropTypes.string,
  'data-testid': PropTypes.string
};

// Component size and spacing props
export const SizeProps = {
  size: SizeVariant,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  margin: SpacingValue,
  marginTop: SpacingValue,
  marginRight: SpacingValue,
  marginBottom: SpacingValue,
  marginLeft: SpacingValue,
  padding: SpacingValue,
  paddingTop: SpacingValue,
  paddingRight: SpacingValue,
  paddingBottom: SpacingValue,
  paddingLeft: SpacingValue
};

// Loading and state props
export const StateProps = {
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  success: PropTypes.bool,
  warning: PropTypes.bool
};

// Common component configuration
export const ComponentConfig = {
  ...HtmlAttributes,
  ...EventHandlers,
  ...SizeProps,
  ...StateProps,
  variant: ColorVariant,
  children: PropTypes.node
};

// Export all as default for easy importing
export default {
  SizeVariant,
  ColorVariant,
  ButtonVariant,
  SpacingValue,
  BreakpointValue,
  AlignmentValue,
  PositionValue,
  TextSize,
  FontWeight,
  ComponentState,
  NavigationItem,
  User,
  Product,
  Order,
  FormField,
  Step,
  CardConfig,
  TableColumn,
  PaginationConfig,
  ModalConfig,
  NotificationConfig,
  ThemeConfig,
  ApiResponse,
  FileUploadConfig,
  ChartData,
  DateRange,
  SearchConfig,
  FilterConfig,
  EventHandlers,
  HtmlAttributes,
  SizeProps,
  StateProps,
  ComponentConfig
};