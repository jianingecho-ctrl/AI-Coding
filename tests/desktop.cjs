const {_electron: electron} = require('playwright');
const {expect} = require('@playwright/test');
const {mkdtemp, rm, mkdir, readFile} = require('node:fs/promises');
const {tmpdir} = require('node:os');
const path = require('node:path');

(async () => {
  const data = await mkdtemp(path.join(tmpdir(), 'judge-desktop-'));
  let app;
  const errors = [];
  async function launch() {
    app = await electron.launch({args: ['.'], env: {...process.env, JUDGE_DATA_DIR: data}, timeout: 30000});
    await expect.poll(() => app.windows().length).toBe(2);
    await expect.poll(() => app.windows().filter(p => p.url().includes('view=')).length).toBe(2);
    const pet = app.windows().find(p => p.url().includes('view=pet'));
    const panel = app.windows().find(p => p.url().includes('view=panel'));
    for (const page of [pet, panel]) page.on('pageerror', e => errors.push(e.message));
    await panel.getByRole('heading', {name: '测试面板', exact: true}).waitFor();
    await expect(panel.getByRole('button', {name: '发送并触发动画 ↗'})).toBeEnabled();
    return {pet, panel};
  }
  async function send(panel, id) {
    await panel.getByLabel('消息来自').selectOption(id);
    await panel.getByRole('button', {name: '发送并触发动画 ↗'}).click();
    await expect(panel.getByRole('status')).toHaveText('消息已送达桌宠，打开桌宠窗口查看动画。');
  }
  try {
    let {pet, panel} = await launch();
    const flags = await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().map(w => ({
      top: w.isAlwaysOnTop(), preferences: w.webContents.getLastWebPreferences(),
    })));
    if (!flags.some(w => w.top) || flags.some(w => !w.preferences.contextIsolation || w.preferences.nodeIntegration))
      throw Error('桌宠窗口安全或置顶设置无效');
    await expect.poll(() => pet.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    await expect(pet.locator('.character.camel svg')).toBeVisible();
    await send(panel, 'annoying');
    await expect(pet.locator('.slide-kneel')).toBeVisible();
    await expect(pet.locator('.character.kneel')).toBeVisible();
    await expect(pet.locator('.camel-standing-legs')).toBeHidden();
    await expect(pet.locator('.camel-kneeling-legs')).toBeVisible();
    await expect(pet.locator('.camel-raised-arms')).toBeVisible();
    await expect(pet.locator('.camel-knee.left')).toBeVisible();
    await expect(pet.locator('.camel-knee.right')).toBeVisible();
    await pet.locator('.pet-scene').evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
    });
    const kneeGeometry = await pet.locator('.camel-art').evaluate(svg => {
      const floor = new DOMPoint(150, 347).matrixTransform(svg.getScreenCTM());
      const knees = Array.from(svg.querySelectorAll('.camel-knee')).map(knee => {
        const rect = knee.getBoundingClientRect();
        return {center: rect.x + rect.width / 2, floorGap: Math.abs(floor.y - rect.bottom)};
      });
      const calves = Array.from(svg.querySelectorAll('.camel-folded-calf')).map(calf => {
        const rect = calf.getBBox();return rect.width / rect.height;
      });
      return {knees, calves};
    });
    expect(kneeGeometry.knees).toHaveLength(2);
    expect(kneeGeometry.knees[0].center).toBeLessThan(kneeGeometry.knees[1].center);
    for (const knee of kneeGeometry.knees) expect(knee.floorGap).toBeLessThan(8);
    for (const ratio of kneeGeometry.calves) expect(ratio).toBeGreaterThan(1.7);
    await expect(pet.getByText('明天下午3点前、本周', {exact: true})).toBeVisible();
    await pet.getByRole('button', {name: '查看原消息'}).click();
    await expect(pet.locator('.original')).toBeVisible();
    await pet.getByRole('button', {name: '继续跪着'}).click();
    await expect(pet.getByRole('button', {name: '正在跪着…'})).toBeVisible();
    await pet.getByRole('button', {name: '收起原消息'}).click();
    await pet.waitForTimeout(1200);
    await expect(pet.locator('.character.kneel')).toBeVisible();
    await pet.locator('.message-card').evaluate(element => {element.scrollTop = 0;});
    await mkdir('test-results', {recursive: true});
    await pet.screenshot({path: 'test-results/pet.png', omitBackground: true});
    await panel.screenshot({path: 'test-results/panel.png'});
    await pet.getByRole('button', {name: '关闭', exact: true}).click();
    await expect(pet.locator('.message-card')).toHaveCount(0);
    await expect(pet.locator('.character.fish')).toBeVisible({timeout: 7000});
    await expect(pet.locator('.character.yawn')).toBeVisible({timeout: 7000});
    for (const [id, action, entry, card, gag] of [['boss', 'salute', 'fade', 'verdict', 'paper'], ['friend', 'happy', 'bounce', 'chat', 'hearts'], ['colleague', 'wave', 'fade', 'note', 'fish']]) {
      await send(panel, id);
      await expect(pet.locator('.character.' + action)).toBeVisible();
      await expect(pet.locator('.pet-scene.entry-' + entry)).toBeVisible();
      await expect(pet.locator('.message-card.card-' + card)).toBeVisible();
      await expect(pet.locator('[data-gag="' + gag + '"]')).toBeVisible();
    }
    await send(panel, 'nemesis');
    await expect(pet.locator('.character.panic.kneel')).toBeVisible();
    await expect(pet.locator('.message-card.card-alarm')).toBeVisible();
    await expect(pet.locator('[data-gag="overload"]')).toBeVisible();
    await pet.waitForTimeout(3600);
    await expect(pet.locator('.character.panic.kneel')).toBeVisible();
    await expect(pet.locator('.message-card')).toBeVisible();

    // 未保存的配置也能预览，不能改变历史数量或持久化联系人。
    await panel.getByRole('button', {name: '联系人', exact: true}).click();
    await panel.getByRole('button', {name: '自定义陈同事的效果'}).click();
    let editor = panel.getByRole('region', {name: '个性效果编辑器'});
    await editor.getByLabel('人物动作', {exact: true}).selectOption('fish');
    await editor.getByLabel('进场方式', {exact: true}).selectOption('spin');
    await editor.getByLabel('人物皮肤', {exact: true}).selectOption('neon');
    await editor.getByLabel('消息卡片皮肤', {exact: true}).selectOption('chat');
    await editor.getByLabel('搞笑特效', {exact: true}).selectOption('hearts');
    await editor.getByLabel('专属吐槽台词').fill('陈同事来了，驼驼带薪转圈！');
    await editor.getByRole('button', {name: '播放桌面预览'}).click();
    await expect(pet.getByText('效果预览 · 不记录历史')).toBeVisible();
    await expect(pet.locator('.pet-scene.entry-spin')).toBeVisible();
    await expect(pet.locator('.character.fish.skin-neon')).toBeVisible();
    await expect(pet.locator('.message-card.card-chat')).toBeVisible();
    let disk = JSON.parse(await readFile(path.join(data, 'judge-state.json'), 'utf8'));
    expect(disk.history).toHaveLength(5);
    expect(disk.contacts.find(c => c.id === 'colleague').effects).toBeUndefined();
    await editor.getByRole('button', {name: '保存个性效果'}).click();
    await expect(panel.getByRole('status')).toHaveText('个性效果已保存。');
    await editor.locator('.effect-preview').screenshot({path: 'test-results/custom-effect.png'});
    await panel.getByRole('button', {name: '测试面板', exact: true}).click();
    await send(panel, 'colleague');
    await expect(pet.locator('.character.fish.skin-neon')).toBeVisible();
    await expect(pet.getByText('陈同事来了，驼驼带薪转圈！')).toBeVisible();
    disk = JSON.parse(await readFile(path.join(data, 'judge-state.json'), 'utf8'));
    expect(disk.history[0].effect).toMatchObject({action: 'fish', entry: 'spin', characterSkin: 'neon', cardSkin: 'chat', gag: 'hearts'});

    // 类别改变后保持滑跪规则；预览恢复默认仅修改草稿。
    await panel.getByRole('button', {name: '联系人', exact: true}).click();
    await panel.getByLabel('陈同事的类别').selectOption('特别讨厌的人');
    await expect(panel.getByRole('status')).toHaveText('联系人类别已保存。');
    editor = panel.getByRole('region', {name: '个性效果编辑器'});
    await expect(editor.getByLabel('进场方式', {exact: true})).toBeDisabled();
    await editor.getByRole('button', {name: '播放桌面预览'}).click();
    await expect(pet.locator('.character.panic.kneel.skin-neon')).toBeVisible();
    await editor.getByRole('button', {name: '恢复类别默认'}).click();
    await expect(editor.getByLabel('人物皮肤', {exact: true})).toHaveValue('auto');
    await expect(editor.getByLabel('专属吐槽台词')).toHaveValue('');
    await panel.getByLabel('陈同事的类别').selectOption('普通同事');
    await expect(panel.getByRole('status')).toHaveText('联系人类别已保存。');

    await panel.getByLabel('联系人姓名', {exact: true}).fill('测试同事');
    await panel.locator('.add-contact').getByLabel('类别', {exact: true}).selectOption('特别讨厌的人');
    await panel.getByRole('button', {name: '添加联系人'}).click();
    await expect(panel.getByRole('button', {name: '自定义测试同事的效果'})).toBeVisible();
    await expect(panel.getByLabel('测试同事的类别')).toHaveValue('特别讨厌的人');

    // 每套人物皮肤都有配件与实际的桌宠展示；个人设置优先于全局。
    await panel.getByRole('button', {name: '人物设置', exact: true}).click();
    await expect(panel.locator('.skin-gallery .skin-choice')).toHaveCount(4);
    const poses = panel.locator('.pose-gallery');
    await expect(poses.locator('[data-pose="standing"]')).toHaveCount(1);
    await expect(poses.locator('[data-pose="kneeling"]')).toHaveCount(2);
    const heightDifference = await poses.evaluate(gallery => {
      const samples = gallery.querySelectorAll('.character');
      return Array.from(samples).slice(0, 2).map(sample => {
        const top = sample.querySelector('svg').getBoundingClientRect().top;
        return sample.querySelector('.camel-head').getBoundingClientRect().top - top;
      });
    });
    expect(heightDifference[1] - heightDifference[0]).toBeGreaterThan(12);
    await poses.scrollIntoViewIfNeeded();
    await panel.waitForTimeout(2500);
    await poses.screenshot({path: 'test-results/poses.png'});
    for (const [skin, name] of [['milktea', '奶茶摸鱼'], ['neon', '霓虹加班'], ['judge', '赛博判官'], ['desert', '沙漠社畜']]) {
      await panel.getByRole('button', {name, exact: true}).click();
      await panel.getByRole('button', {name: '保存人物设置'}).click();
      await expect(panel.getByRole('status')).toHaveText('人物设置已保存。');
      await pet.getByRole('button', {name: '关闭', exact: true}).click();
      await expect(pet.locator('.character.skin-' + skin)).toBeVisible();
      if (skin !== 'desert') {
        await panel.getByRole('button', {name: '测试面板', exact: true}).click();
        await send(panel, 'boss');
        await panel.getByRole('button', {name: '人物设置', exact: true}).click();
      }
    }
    await panel.getByRole('button', {name: '赛博判官', exact: true}).click();
    await panel.getByLabel('小判官昵称').fill('测试判官');
    await panel.getByLabel('工服颜色').selectOption('蜜桃粉');
    await panel.getByRole('button', {name: '保存人物设置'}).click();
    await expect(pet.locator('.pet-name')).toHaveText('测试判官 · 工位驼');
    await panel.locator('.skin-gallery').screenshot({path: 'test-results/skins.png'});

    const expectedCount = 9;
    await panel.getByRole('button', {name: '消息历史', exact: true}).click();
    await expect(panel.locator('.history-item')).toHaveCount(expectedCount);
    // 已接收的个人消息仍是粉色气泡，没有跟着全局皮肤更新。
    await expect(panel.locator('.history-item').filter({hasText: '陈同事来了，驼驼带薪转圈！'}).locator('.card-chat')).toBeVisible();
    if (errors.length) throw Error(errors.join('\n'));
    await app.close();
    ({pet, panel} = await launch());
    await expect(pet.locator('.pet-name')).toHaveText('测试判官 · 工位驼');
    await expect(pet.locator('.character.skin-judge')).toBeVisible();
    await panel.getByRole('button', {name: '联系人', exact: true}).click();
    await expect(panel.getByLabel('测试同事的类别')).toHaveValue('特别讨厌的人');
    await panel.getByRole('button', {name: '自定义陈同事的效果'}).click();
    editor = panel.getByRole('region', {name: '个性效果编辑器'});
    await expect(editor.getByLabel('人物皮肤', {exact: true})).toHaveValue('neon');
    await expect(editor.getByLabel('人物动作', {exact: true})).toHaveValue('fish');
    await expect(editor.getByLabel('进场方式', {exact: true})).toHaveValue('spin');
    await expect(editor.getByLabel('专属吐槽台词')).toHaveValue('陈同事来了，驼驼带薪转圈！');
    await panel.getByRole('button', {name: '测试面板', exact: true}).click();
    await send(panel, 'colleague');
    await expect(pet.locator('.character.skin-neon')).toBeVisible();
    await pet.getByRole('button', {name: '关闭', exact: true}).click();
    await expect(pet.locator('.character.skin-judge')).toBeVisible();
    // 系统减少动态效果偏好也生效。
    await pet.emulateMedia({reducedMotion: 'reduce'});
    await panel.getByRole('button', {name: '播放桌面预览', exact: true}).click();
    await expect(pet.locator('.scene-effects')).toBeHidden();
    await panel.getByRole('button', {name: '消息历史', exact: true}).click();
    await expect(panel.locator('.history-item')).toHaveCount(expectedCount + 1);
    panel.once('dialog', d => d.accept());
    await panel.getByRole('button', {name: '清空历史'}).click();
    await expect(panel.locator('.history-item')).toHaveCount(0);
    await panel.close();
    await expect(pet.locator('.pet-name')).toBeVisible();
    if (errors.length) throw Error(errors.join('\n'));
    console.log('桌面验收通过：原创骆驼、五类动作、四套人物与卡片皮肤、进场与搞笑特效、个人覆盖、无历史预览、减少动态效果、重启持久化，以及原版消息操作。');
  } catch (error) {
    if (app) for (const page of app.windows()) {
      const kind = page.url().includes('view=pet') ? 'pet' : 'panel';
      await page.screenshot({path: 'test-results/failure-' + kind + '.png'}).catch(() => {});
    }
    if (errors.length) console.error('渲染错误：', errors);
    throw error;
  } finally {
    if (app) await app.close().catch(() => {});
    await rm(data, {recursive: true, force: true});
  }
})().catch(e => {console.error(e); process.exitCode = 1;});
