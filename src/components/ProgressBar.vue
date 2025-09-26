<template>
  <div class="progress-wrapper mt-md">
    <div class="progress-container">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
    <div class="progress-text">
      {{ progress }}%
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgressBar',
  props: {
    progress: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 100
    }
  }
}
</script>

<style scoped lang="scss">
@import '../main.scss';

.progress-wrapper {
  margin: 20px 0;
}

.progress-container {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background-color: $primary-color;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  text-align: center;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 500;
}
</style>