(function() {
	var PhotoFloat = (function() {
		PhotoFloat.cachePath = function(path) {
			if (path === "")
				return "root";
			if (path[0] === "/")
				path = path.substring(1);
			path = path
				.replace(/ /g, "_")
				.replace(/\//g, "-")
				.replace(/\(/g, "")
				.replace(/\)/g, "")
				.replace(/#/g, "")
				.replace(/&/g, "")
				.replace(/,/g, "")
				.replace(/\[/g, "")
				.replace(/\]/g, "")
				.replace(/"/g, "")
				.replace(/'/g, "")
				.replace(/_-_/g, "-")
				.toLowerCase();
			while (path.indexOf("--") !== -1)
				path = path.replace(/--/g, "-");
			while (path.indexOf("__") !== -1)
				path = path.replace(/__/g, "_");
			return path;
		};
		PhotoFloat.photoHash = function(album, photo) {
			return PhotoFloat.albumHash(album) + "/" + PhotoFloat.cachePath(photo.name);
		};
		PhotoFloat.albumHash = function(album) {
			if (typeof album.photos !== "undefined" && album.photos !== null)
				return PhotoFloat.cachePath(album.path);
			return PhotoFloat.cachePath(album.parent.path + "/" + album.path);
		};
		PhotoFloat.photoPath = function(album, photo, size, square) {
			var suffix;
			if (square)
				suffix = size.toString() + "s";
			else
				suffix = size.toString();
			return "cache/" + PhotoFloat.cachePath(PhotoFloat.photoHash(album, photo) + "_" + suffix + ".jpg");
		};
		PhotoFloat.originalPhotoPath = function(album, photo) {
			return "albums/" + album.path + "/" + photo.name;
		};
		PhotoFloat.trimExtension = function(name) {
			var index = name.lastIndexOf(".");
			if (index != -1)
				return name.substring(0, index)
			return name;
		};
		PhotoFloat.cleanHash = function(hash) {
			while (hash.length) {
				if (hash[0] === "#")
					hash = hash.substring(1);
				else if (hash[0] === "!")
					hash = hash.substring(1);
				else if (hash[0] === "/")
					hash = hash.substring(1);
				else if (hash[hash.length - 1] === "/")
					hash = hash.substring(0, hash.length - 1);
				else
					break;
			}
			return hash;
		};
		function PhotoFloat() {
			this.albumCache = [];
		}
		PhotoFloat.prototype.cachePath = PhotoFloat.cachePath;
		PhotoFloat.prototype.photoHash = PhotoFloat.photoHash;
		PhotoFloat.prototype.albumHash = PhotoFloat.albumHash;
		PhotoFloat.prototype.photoPath = PhotoFloat.photoPath;
		PhotoFloat.prototype.originalPhotoPath = PhotoFloat.originalPhotoPath;
		PhotoFloat.prototype.trimExtension = PhotoFloat.trimExtension;
		PhotoFloat.prototype.cleanHash = PhotoFloat.cleanHash;
		PhotoFloat.prototype.album = function(subalbum, callback, error) {
			var cacheKey, ajaxOptions, self;
			if (typeof subalbum.photos !== "undefined" && subalbum.photos !== null) {
				callback(subalbum);
				return;
			}
			if (Object.prototype.toString.call(subalbum).slice(8, -1) === "String")
				cacheKey = subalbum;
			else
				cacheKey = PhotoFloat.cachePath(subalbum.parent.path + "/" + subalbum.path);
			if (cacheKey in this.albumCache) {
				callback(this.albumCache[cacheKey]);
				return;
			}
			self = this;
			ajaxOptions = {
				type: "GET",
				dataType: "json",
				url: "cache/" + cacheKey + ".json",
				success: function(album) {
					var i;
					for (i = 0; i < album.albums.length; ++i)
						album.albums[i].parent = album;
					for (i = 0; i < album.photos.length; ++i)
						album.photos[i].parent = album;
					self.albumCache[cacheKey] = album;
					callback(album);
				}
			};
			if (typeof error !== "undefined" && error !== null)
				ajaxOptions.error = error;
			$.ajax(ajaxOptions);
		};
		PhotoFloat.prototype.albumPhoto = function(subalbum, callback, error) {
			var nextAlbum, self;
			self = this;
			nextAlbum = function(album) {
				var index = Math.floor(Math.random() * (album.photos.length + album.albums.length));
				if (index >= album.photos.length) {
					index -= album.photos.length;
					self.album(album.albums[index], nextAlbum, error);
				} else
					callback(album, album.photos[index]);
			};
			if (typeof subalbum.photos !== "undefined" && subalbum.photos !== null)
				nextAlbum(subalbum);
			else
				this.album(subalbum, nextAlbum, error);
		};
		PhotoFloat.prototype.parseHash = function(hash, callback, error) {
			var index, album, photo;
			hash = PhotoFloat.cleanHash(hash);
			index = hash.lastIndexOf("/");
			if (!hash.length) {
				album = PhotoFloat.cachePath("root");
				photo = null;
			} else if (index != -1 && index != hash.length - 1) {
				photo = hash.substring(index + 1);
				album = hash.substring(0, index);
			} else {
				album = hash;
				photo = null;
			}
			this.album(album, function(theAlbum) {
				var i = -1;
				if (photo != null) {
					for (i = 0; i < theAlbum.photos.length; ++i) {
						if (PhotoFloat.cachePath(theAlbum.photos[i].name) == photo) {
							photo = theAlbum.photos[i];
							break;
						}
					}
					if (i >= theAlbum.photos.length) {
						photo = null;
						i = -1;
					}
				}
				callback(theAlbum, photo, i);
			}, error);
		};
		return PhotoFloat;
	})();
	window.PhotoFloat = PhotoFloat;
}).call(this);