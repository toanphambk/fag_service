let _config_block = {};
for (let i = 0; i <= 19; i++) {
  _config_block[`vehicleCode${i}`] = `DB8,C${6 * i}.4`;
  _config_block[`vehicleMode${i}`] = `DB8,C${6 * i + 4}.1`;
}
console.log(_config_block);
