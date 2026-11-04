package contacts

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"io/fs"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
	"github.com/jalusw/swantara/apps/service/internal/storage"
)

type ContactAvatarService struct {
	contacts ContactDAO
	store    storage.Store
}

func NewContactAvatarService(contacts ContactDAO, store storage.Store) ContactAvatarService {
	return ContactAvatarService{contacts: contacts, store: store}
}

func (s ContactAvatarService) Upload(ctx context.Context, contactID uint64, organizationID uint64, reader io.Reader) (string, error) {
	content, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	if len(content) == 0 {
		return "", ErrAvatarEmpty
	}
	if !helper.IsImage(content) {
		return "", ErrAvatarInvalidType
	}

	contact, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return "", dao.NotFound(err, ErrContactNotFound)
	}
	if contact == nil || !scope.Owns(contact.OrganizationID, organizationID) {
		return "", ErrContactNotFound
	}

	objectID := s.objectID(contactID, content)
	if contact.Avatar != nil && *contact.Avatar == objectID {
		return objectID, nil
	}

	if err := s.store.Save(ctx, objectID, bytes.NewReader(content)); err != nil {
		return "", err
	}

	oldAvatar := contact.Avatar
	contact.Avatar = &objectID
	if _, err := s.contacts.Update(ctx, contact); err != nil {
		_ = s.store.Delete(ctx, objectID)
		return "", err
	}

	if oldAvatar != nil && *oldAvatar != "" && *oldAvatar != objectID {
		_ = s.store.Delete(ctx, *oldAvatar)
	}
	return objectID, nil
}

func (s ContactAvatarService) Download(ctx context.Context, contactID uint64, organizationID uint64) (io.ReadCloser, error) {
	contact, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return nil, dao.NotFound(err, ErrAvatarNotFound)
	}
	if contact == nil || !scope.Owns(contact.OrganizationID, organizationID) || contact.Avatar == nil || *contact.Avatar == "" {
		return nil, ErrAvatarNotFound
	}
	reader, err := s.store.Open(ctx, *contact.Avatar)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, ErrAvatarNotFound
		}
		return nil, err
	}
	return reader, nil
}

func (s ContactAvatarService) objectID(contactID uint64, content []byte) string {
	checksum := sha256.Sum256(content)
	return fmt.Sprintf("contact-avatars/%d/%s", contactID, hex.EncodeToString(checksum[:]))
}
