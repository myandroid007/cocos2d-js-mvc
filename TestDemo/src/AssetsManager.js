var __failCount = 0;

var AssetsManagerLoaderScene = cc.Scene.extend({
	_am:null,
	_progress:null,
	_percent:0,
	_percentByFile:0,
	run:function(){
		if (!cc.sys.isNative || common.GameConfig.Debug) {
			this.loadGame();
			return;
		}

		var layer = new cc.Layer();
		this.addChild(layer);
		this._progress = new cc.LabelTTF.create("0%", "Arial", 12);
		this._progress.x = cc.winSize.width / 2;
		this._progress.y = cc.winSize.height / 2 + 50;
		layer.addChild(this._progress);

		// android: /data/data/com.huanle.magic/files/
		var storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "./");
		//var storagePath = "F:/jjyx/afanty/client/CocosJSGameUpdate/";
		//var storagePath = "./";
		
		this._am = new jsb.AssetsManager("res/project.manifest", storagePath);
		this._am.retain();

		if (!this._am.getLocalManifest().isLoaded())
		{
			cc.log("Fail to update assets, step skipped.");
			this.loadGame();
		}
		else
		{
			var that = this;
			var listener = new jsb.EventListenerAssetsManager
			(this._am,			
				function(event) {
					switch (event.getEventCode())
					{
						case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
							cc.log("No local manifest file found, skip assets update.");
							that.loadGame();
							break;
						case jsb.EventAssetsManager.UPDATE_PROGRESSION:
							that._percent = event.getPercent();
							that._percentByFile = event.getPercentByFile();
							cc.log(that._percent + "%");
							var msg = event.getMessage();
							if (msg) {
								cc.log(msg);
							}
							break;
						case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
						case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
							cc.log("Fail to download manifest file, update skipped.");
							that.loadGame();
							break;
						case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
						case jsb.EventAssetsManager.UPDATE_FINISHED:
							cc.log("Update finished.");
							that.loadGame();
							break;
						case jsb.EventAssetsManager.UPDATE_FAILED:
							cc.log("Update failed. " + event.getMessage());
							__failCount ++;
							if (__failCount < 5)
							{
								that._am.downloadFailedAssets();
							}
							else
							{
								cc.log("Reach maximum fail count, exit update process");
								__failCount = 0;
								that.loadGame();
							}
							break;
						case jsb.EventAssetsManager.ERROR_UPDATING:
							cc.log("Asset update error: " + event.getAssetId() + ", " + event.getMessage());
							that.loadGame();
							break;
						case jsb.EventAssetsManager.ERROR_DECOMPRESS:
							cc.log(event.getMessage());
							that.loadGame();
							break;
						default:
							break;
					}
				}
			);
			cc.eventManager.addListener(listener, 1);
			this._am.update();
			cc.director.runScene(this);
		}
		this.schedule(this.updateProgress, 0.5);
	},
	loadGame:function(){
		cc.loader.loadJs(["src/files.js"], function(err){
			cc.loader.loadJs(jsFiles, function(err){			
//				先预加载资，加载界面在cocos2d-html5/core/scenes/CCLoaderScene.js
				cc.LoaderScene.preload(g_resources, function () {
					//游戏控制器启动
					var initSceneMediator = new init.InitSceneMediator(new init.InitScene());
					initSceneMediator.rootLayer(new init.InitLayerMediator(new init.InitLayer()));
					game.Frameworks.init({width:960, height:640}, "DEBUG", initSceneMediator);
				}, this);
			});
		});
	},
	updateProgress:function(dt){
		this._progress.string = "检查更新: " + this._percent.toFixed(2) + "%";
	},
	onExit:function(){
		cc.log("AssetsManager::onExit");
		this._am.release();
		this._super();
	}
});