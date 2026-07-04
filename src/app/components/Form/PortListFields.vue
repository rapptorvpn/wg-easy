<template>
  <div class="flex flex-col gap-2">
    <template v-for="(field, i) in forwardingFields" :key="i">
      <template
        v-if="
          field?.srcPort ||
          field?.dstPort ||
          i == editFieldIndex ||
          i === forwardingFields.length - 1
        "
      >
        <PortListField
          :validation="validation[i]"
          :show-labels="i === 0"
          :port="field"
          :show-delete="i !== forwardingFields.length - 1"
          @delete="onPortDelete(i)"
          @change="onPortChange($event, i)"
          @blur="onPortBlur"
          @focus="onPortFocus(i)"
        />
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import PortListField from './PortListField.vue';

const props = withDefaults(
  defineProps<{
    portForwardingItems: PortForwardingDefinition[];
    unavailablePorts?: PortDefinition[];
    ipv4: string;
  }>(),
  {
    unavailablePorts: () => [],
  }
);

const portForwarding = defineModel<(PortListFieldItem | undefined)[]>(
  'port-forwarding',
  {
    default: () => [undefined],
  }
);

const forwardingFields = computed(() => {
  return [...portForwarding.value, undefined];
});

const portForwardingItemsWithForwardingFields = computed(
  (): PortForwardingDefinition[] => {
    const forwardingFieldsIndex = props.portForwardingItems.findIndex(
      (portForwardingItem) => {
        return portForwardingItem.ipv4 === props.ipv4;
      }
    );
    const portForwardingItem = {
      ipv4: props.ipv4,
      ports: toPortForwardingItems(
        portForwarding.value.filter((port) => {
          return !!port;
        })
      ),
    };
    return props.portForwardingItems[forwardingFieldsIndex]
      ? [
          ...props.portForwardingItems.slice(0, forwardingFieldsIndex),
          portForwardingItem,
          ...props.portForwardingItems.slice(forwardingFieldsIndex + 1),
        ]
      : [...props.portForwardingItems, portForwardingItem];
  }
);

const validation = computed(() => {
  return forwardingFields.value.map((field) => {
    return (
      field &&
      portRangeIsValid(
        portForwardingItemsWithForwardingFields.value,
        field.srcPort,
        field.dstPort,
        field.type,
        props.unavailablePorts,
        props.ipv4
      )
    );
  });
});

const onPortChange = (
  portDef: PortListFieldItem | undefined,
  index: number
) => {
  if (portDef) {
    if (index > portForwarding.value.length - 1) {
      portForwarding.value.push(portDef);
    } else {
      portForwarding.value[index] = portDef;
    }
  }
};

const onPortBlur = () => {
  editFieldIndex.value = undefined;
};

const onPortDelete = (index: number) => {
  editFieldIndex.value = undefined;
  portForwarding.value[index] = undefined;
};

const onPortFocus = (index: number) => {
  editFieldIndex.value = index;
};

const editFieldIndex = ref<number | undefined>(undefined);
</script>
